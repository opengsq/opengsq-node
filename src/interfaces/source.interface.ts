/**
 * Represents the server information returned by the A2S_INFO query.
 * This interface supports both Source Engine and Obsolete GoldSource responses.
 */
export interface SourceServerInfo {
    /**
     * Protocol version used by the server.
     */
    protocol: number;

    /**
     * Name of the server.
     */
    name: string;

    /**
     * Map the server has currently loaded.
     */
    map: string;

    /**
     * Name of the folder containing the game files.
     */
    folder: string;

    /**
     * Full name of the game.
     */
    game: string;

    /**
     * Number of players on the server.
     */
    players: number;

    /**
     * Maximum number of players the server reports it can hold.
     */
    maxPlayers: number;

    /**
     * Number of bots on the server.
     */
    bots: number;

    /**
     * Type of server:
     * - 'D' for dedicated server
     * - 'L' for non-dedicated server
     * - 'P' for HLTV server
     */
    serverType: string;

    /**
     * Operating system of the server:
     * - 'L' for Linux
     * - 'W' for Windows
     */
    environment: string;

    /**
     * Whether the server requires a password:
     * - 0 for public
     * - 1 for private
     */
    visibility: number;

    /**
     * Whether the server uses VAC:
     * - 0 for unsecured
     * - 1 for secured
     */
    vac: number;

    /**
     * Steam App ID of the game (Source Engine only).
     */
    id?: number;

    /**
     * Version of the game (Source Engine only).
     */
    version?: string;

    /**
     * Additional data specific to Source Engine servers.
     */
    extraData?: {
        /**
         * Port of the server (if extraDataFlag & 0x80).
         */
        port?: number;

        /**
         * Steam ID of the server (if extraDataFlag & 0x10).
         */
        steamID?: bigint;

        /**
         * SourceTV port (if extraDataFlag & 0x40).
         */
        tvPort?: number;

        /**
         * SourceTV name (if extraDataFlag & 0x40).
         */
        tvName?: string;

        /**
         * Server keywords (if extraDataFlag & 0x20).
         */
        keywords?: string;

        /**
         * Game ID (if extraDataFlag & 0x01).
         */
        gameID?: bigint;
    };

    /**
     * IP address and port of the server (Obsolete GoldSource only).
     */
    address?: string;

    /**
     * Mod-specific information (Obsolete GoldSource only).
     */
    mod?: {
        /**
         * URL to mod website.
         */
        link: string;

        /**
         * URL to download the mod.
         */
        downloadLink: string;

        /**
         * Version of mod installed on server.
         */
        version: number;

        /**
         * Space (in bytes) the mod takes up.
         */
        size: number;

        /**
         * Type of mod:
         * - 0 for single and multiplayer mod
         * - 1 for multiplayer-only mod
         */
        type: number;

        /**
         * Whether mod uses its own DLL:
         * - 0 if it uses the Half-Life DLL
         * - 1 if it uses its own DLL
         */
        dll: number;
    };
}

/**
 * Represents player information returned by the A2S_PLAYER query.
 */
export interface SourcePlayerInfo {
    /**
     * Index of the player.
     */
    index: number;

    /**
     * Name of the player.
     */
    name: string;

    /**
     * Score of the player.
     */
    score: number;

    /**
     * Duration (in seconds) the player has been connected to the server.
     */
    duration: number;

    /**
     * Number of deaths (The Ship only).
     */
    deaths?: number;

    /**
     * Amount of money (The Ship only).
     */
    money?: number;
}