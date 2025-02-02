import * as dgram from 'dgram';
import * as crc32 from 'crc-32';
import { BufferReader } from './lib/buffer-reader';
import type { ServerInfo, PlayerInfo } from './interfaces/source.interface';

/**
 * A class for querying Source game servers (e.g., GoldSource, Source Engine) using the A2S protocol.
 * Supports retrieving server information, player information, and server rules.
 *
 * @example
 * const source = new Source('127.0.0.1', 27015);
 * source.getInfo().then(info =\> console.log(info));
 *
 * @public
 */
export default class Source {
    private host: string;
    private port: number;
    private timeout: number;
    private debug: boolean;

    /**
     * Creates a new Source server query instance.
     *
     * @param host - The IP address or hostname of the server.
     * @param port - The port number of the server.
     * @param timeout - The timeout duration (in milliseconds) for server queries. Default is 5000.
     * @param debug - Enables debug logging if true. Default is false.
     */
    constructor(host: string, port: number, timeout = 5000, debug = false) {
        this.host = host;
        this.port = port;
        this.timeout = timeout;
        this.debug = debug;
    }

    /**
     * Retrieves server information.
     *
     * @returns A promise that resolves with the server information.
     */
    public getInfo(): Promise<ServerInfo> {
        return new Promise((resolve, reject) => this.get(0x54, resolve, reject));
    }

    /**
     * Retrieves player information.
     *
     * @returns A promise that resolves with an array of player information.
     */
    public getPlayers(): Promise<PlayerInfo[]> {
        return new Promise((resolve, reject) => this.get(0x55, resolve, reject));
    }

    /**
     * Retrieves server rules.
     *
     * @returns A promise that resolves with a map of server rules.
     */
    public getRules(): Promise<Record<string, string>> {
        return new Promise((resolve, reject) => this.get(0x56, resolve, reject));
    }

    /**
     * Sends a request to the server and handles the response.
     *
     * @param header - The A2S header for the request.
     * @param resolve - The resolve function of the promise.
     * @param reject - The reject function of the promise.
     * @throws Will throw an error if the request fails or the response is invalid.
     */
    private get(header: number, resolve: (data: any) => void, reject: (err: Error) => void) {
        const maxRetries = 2;
        let retryCount = 0;
        let packets: Record<string, Buffer> = {};
        let isCompressed = false;
        let crc32CheckSum = 0;

        // Multi-packet Response Format Goldsource Server
        // Obsolete GoldSource Response
        let goldSource = false;

        // Maximum size of packet before packet switching occurs.
        // AppIDs which are known not to contain this field:
        // 215, 17550, 17700, and 240 when protocol = 7.
        let orangeBox = true;

        const timeoutId = setTimeout(() => {
            reject(new Error('Request timed out'));
            socket.close();
        }, this.timeout);

        const sendRequest = (challenge?: Buffer): void => {
            let request = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, header]);

            if (header === 0x54) { // A2S_INFO
                request = Buffer.concat([request, Buffer.from([0x53, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45, 0x6E, 0x67, 0x69, 0x6E, 0x65, 0x20, 0x51, 0x75, 0x65, 0x72, 0x79, 0x00])]);
            }

            if (challenge) {
                request = Buffer.concat([request, challenge]);
            } else if (header !== 0x54) { // A2S_INFO
                request = Buffer.concat([request, Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])]);
            }

            if (this.debug) console.log("[DEBUG] Send:", request)

            socket.send(request, 0, request.length, this.port, this.host);
        }

        const parseResponse = (payload: Buffer): any => {
            const reader = new BufferReader(payload, 4);
            const header = reader.readInt8();

            if (header === 0x49) { // A2S_INFO
                return this.parseInfoResponse(reader);
            } else if (header === 0x6D) { // A2S_INFO - Obsolete GoldSource response
                return this.parseInfoObsoleteResponse(reader);
            } else if (header === 0x44) { // A2S_PLAYER
                return this.parsePlayerResponse(reader);
            } else if (header === 0x45) { // A2S_RULES
                return this.parseRulesResponse(reader);
            }

            throw new Error('Unknown response type');
        }

        const reload = (message?: Buffer) => {
            if (this.debug) console.log("[DEBUG] Packet: Reload");

            const entries = Object.values(packets);
            packets = {};

            if (message) {
                entries.push(message);
            }

            for (const message of entries) {
                onMessage(message);
            }
        }

        const onMessage = (message: Buffer) => {
            if (this.debug) console.log("[DEBUG] Recv:", message)

            const A2S_CHALLENGE_RESPONSE_HEADER = 0x41;
            const A2S_MULTI_PACKET_HEADER = -2;
            const A2S_SINGLE_PACKET_HEADER = -1;
            const firstPacketPayloadHeader = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
            const reader = new BufferReader(message);
            const header = reader.readInt32();

            if (reader.subarray(4, 5)[0] === A2S_CHALLENGE_RESPONSE_HEADER) {
                const challenge = message.subarray(5, 9);
                if (retryCount < maxRetries) {
                    retryCount++;
                    sendRequest(challenge);
                } else {
                    reject(new Error('Max retries reached while handling challenge'));
                    socket.close();
                }
            } else if (header === A2S_SINGLE_PACKET_HEADER) { // Single-packet response
                resolve(parseResponse(message));
                socket.close();
            } else if (header === A2S_MULTI_PACKET_HEADER) { // Multi-packet response
                const id = reader.readInt32(); // Unique ID for this response
                isCompressed = (id & 0x80000000) !== 0; // Check if the response is compressed

                if (!goldSource) {
                    const start = 9;

                    if (message.subarray(start, start + 4).equals(firstPacketPayloadHeader)) {
                        if (this.debug) console.log("[DEBUG] Packet: Obsolete GoldSource Response Detected");
                        goldSource = true;
                        reload(message);
                        return;
                    }
                }

                let totalPackets, packetNumber;

                if (goldSource) { // Goldsource Server
                    const packetByte = reader.readUint8();
                    packetNumber = (packetByte >> 4) & 0x0F;
                    totalPackets = packetByte & 0x0F;
                } else { // Source Server
                    totalPackets = reader.readUint8(); // Total number of packets
                    packetNumber = reader.readUint8(); // Current packet number

                    if (orangeBox && packetNumber === 0) {
                        const start = isCompressed ? 18 : 10;

                        if (message.subarray(start, start + 4).equals(firstPacketPayloadHeader)) {
                            // Source Server Multi-packet Response Format without size
                            if (this.debug) console.log("[DEBUG] Packet: Below Orange Box Engine Detected");
                            orangeBox = false;
                            reload(message);
                            return;
                        }
                    }

                    if (orangeBox) { // Orange Box Engine and above only.
                        reader.readUint16(); // Maximum size of packet before packet switching occurs.
                    }

                    // For the first packet
                    if (packetNumber === 0 && isCompressed) {
                        if (this.debug) console.log("[DEBUG] Packet: Compression Detected");
                        reader.readUint32(); // Size of the packet (if compressed)
                        crc32CheckSum = reader.readInt32(); // CRC32 checksum of uncompressed response
                    }
                }

                if (this.debug && packetNumber === 0) {
                    console.log("[DEBUG] Total Packets:", totalPackets);
                }

                // Store the payload in the packets object
                packets[packetNumber] = message;

                // Check if all packets have been received
                if (Object.keys(packets).length === totalPackets) {
                    // Reassemble the payload by sorting packets and concatenating them
                    const sortedPackets = Object.entries(packets)
                        .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
                        .map(([id, packet]) => {
                            // Return the payload (remaining bytes)
                            if (goldSource) {
                                return packet.subarray(9);
                            }

                            let start = 10 + (orangeBox ? 2 : 0) + ((id === '0' && isCompressed) ? 8 : 0);
                            return packet.subarray(start);
                        });

                    let assembledPayload = Buffer.concat(sortedPackets);
                    if (this.debug) console.log("[DEBUG] Payload:", assembledPayload);

                    if (isCompressed) {
                        // Decompress the buffer using bzip2
                        var Bunzip = require('seek-bzip');

                        try {
                            assembledPayload = Bunzip.decode(assembledPayload);
                        } catch (error) {
                            if (!orangeBox) throw error;
                            if (this.debug) console.log("[DEBUG] Packet: Below Orange Box Engine Detected");
                            orangeBox = false;
                            reload();
                            return;
                        }

                        if (this.debug) console.log("[DEBUG] Payload (Decompressed):", assembledPayload);

                        // Calculate the CRC32 checksum of the decompressed data
                        const actualChecksum = crc32.buf(assembledPayload);

                        // Verify the checksum
                        if (actualChecksum !== crc32CheckSum) {
                            throw new Error(`Checksum mismatch: expected ${crc32CheckSum}, got ${actualChecksum}`);
                        }
                    }

                    resolve(parseResponse(assembledPayload));
                    socket.close();
                }
            } else {
                reject(new Error('Invalid response header'));
                socket.close();
            }
        }

        const socket = dgram.createSocket('udp4');
        socket.on('message', onMessage);
        socket.on('error', (err) => {
            reject(err);
            socket.close();
        });
        socket.on('close', () => clearTimeout(timeoutId));

        sendRequest();
    }

    /**
     * Parses the server information from the response.
     *
     * @param reader - The BufferReader instance containing the response data.
     * @returns The parsed server information.
     */
    private parseInfoResponse(reader: BufferReader): ServerInfo {
        const info: ServerInfo = {
            protocol: reader.readUint8(),
            name: reader.readString(),
            map: reader.readString(),
            folder: reader.readString(),
            game: reader.readString(),
            id: reader.readUint16(),
            players: reader.readUint8(),
            maxPlayers: reader.readUint8(),
            bots: reader.readUint8(),
            serverType: String.fromCharCode(reader.readUint8()),
            environment: String.fromCharCode(reader.readUint8()),
            visibility: reader.readUint8(),
            vac: reader.readUint8(),
            version: reader.readString(),
        };

        if (reader.getOffset() < reader.byteLength()) {
            const extraDataFlag = reader.readUint8();
            info.extraData = {};

            if (extraDataFlag & 0x80) {
                info.extraData.port = reader.readUint16();
            }

            if (extraDataFlag & 0x10) {
                info.extraData.steamID = reader.readBigUint64();
            }

            if (extraDataFlag & 0x40) {
                info.extraData.tvPort = reader.readUint16();
                info.extraData.tvName = reader.readString();
            }

            if (extraDataFlag & 0x20) {
                info.extraData.keywords = reader.readString();
            }

            if (extraDataFlag & 0x01) {
                info.extraData.gameID = reader.readBigUint64();
            }
        }

        return info;
    }

    /**
     * Parses the server information from an Obsolete GoldSource response.
     *
     * @param reader - The BufferReader instance containing the response data.
     * @returns The parsed server information.
     */
    private parseInfoObsoleteResponse(reader: BufferReader): ServerInfo {
        const info: ServerInfo = {
            address: reader.readString(), // IP address and port of the server.
            name: reader.readString(), // Server name
            map: reader.readString(), // Current map
            folder: reader.readString(), // Game folder
            game: reader.readString(), // Game name
            players: reader.readUint8(), // Number of players
            maxPlayers: reader.readUint8(), // Maximum players
            protocol: reader.readUint8(), // Protocol version
            bots: 0, // Bots (not present in Obsolete GoldSource, default to 0)
            serverType: String.fromCharCode(reader.readUint8()), // Server type: 'D', 'L', or 'P'
            environment: String.fromCharCode(reader.readUint8()), // Environment: 'L' or 'W'
            visibility: reader.readUint8(), // Visibility: 0 (public) or 1 (private)
            vac: 0, // VAC (not present in Obsolete GoldSource, default to 0)
        };

        // Check if the server is running a mod
        if (reader.readUint8() === 1) {
            info.mod = {
                link: reader.readString(), // Mod website URL
                downloadLink: reader.readString(), // Mod download URL
            };

            reader.skip(1); // NULL byte (0x00)
            info.mod.version = reader.readUint32(); // Mod version
            info.mod.size = reader.readUint32(); // Mod size in bytes
            info.mod.type = reader.readUint8(); // Mod type: 0 (single/multiplayer), 1 (multiplayer only)
            info.mod.dll = reader.readUint8(); // Mod DLL: 0 (Half-Life DLL), 1 (custom DLL)
        }

        info.vac = reader.readUint8();
        info.bots = reader.readUint8();

        return info;
    }

    /**
     * Parses the player information from the response.
     *
     * @param reader - The BufferReader instance containing the response data.
     * @returns An array of player information.
     */
    private parsePlayerResponse(reader: BufferReader): PlayerInfo[] {
        const playerCount = reader.readUint8();
        if (this.debug) console.log("[DEBUG] Player Count:", playerCount);

        const players: PlayerInfo[] = [];

        for (let i = 0; i < playerCount; i++) {
            const index = reader.readUint8();
            const name = reader.readString();
            const score = reader.readUint32();
            const duration = reader.readFloat32();

            players.push({ index, name, score, duration });
        }

        // The Ship additional player info (comes after the basic information in the packet):
        if (reader.getOffset() < reader.byteLength()) {
            for (let i = 0; i < playerCount; i++) {
                players[i].deaths = reader.readUint32();
                players[i].money = reader.readUint32();
            }
        }

        return players;
    }

    /**
     * Parses the server rules from the response.
     *
     * @param reader - The BufferReader instance containing the response data.
     * @returns A map of server rules.
     */
    private parseRulesResponse(reader: BufferReader): Record<string, string> {
        const ruleCount = reader.readUint16();
        if (this.debug) console.log("[DEBUG] Rule Count:", ruleCount);

        const rules: Record<string, string> = {};

        for (let i = 0; i < ruleCount; i++) {
            const key = reader.readString();
            const value = reader.readString();
            rules[key] = value;
        }

        return rules;
    }
}

// npx ts-node source.ts
/* istanbul ignore next */
if (require.main === module) {
    const debug = false;
    const source = new Source('91.216.250.10', 27015, 5000, debug); // Multi-packet Response (Source)
    // const source = new Source('46.174.54.71', 27015, 5000, debug); // Multi-packet Response (Source), Compression Detected
    // const source = new Source('46.174.54.237', 27015, 5000, debug); // Obsolete Response - No Mod
    // const source = new Source('182.92.213.179', 27015, 5000, debug); // Obsolete Response - Mod
    // const source = new Source('97.84.113.22', 27015, 5000, debug); // The Ship additional player info

    async function main() {
        const info = await source.getInfo();
        console.log('Server Info:', info);

        const players = await source.getPlayers();
        console.log('Players:', players);

        const rules = await source.getRules();
        console.log('Rules:', rules);
    }

    main();
}
