/**
 * The `BufferReader` class provides methods to read from a `Buffer`
 * with a specified offset. This is useful for parsing binary data.
 *
 * @class
 * @internal
 */
export class BufferReader {
    private buffer: Buffer;
    private offset: number;

    /**
     * Creates a new BufferReader instance.
     *
     * @param buffer - The Buffer to read from.
     * @param initialOffset - The initial offset to start reading from (default is 0).
     */
    constructor(buffer: Buffer, initialOffset: number = 0) {
        this.buffer = buffer;
        this.offset = initialOffset;
    }

    /**
     * Gets the total byte length of the buffer.
     *
     * @returns The byte length of the buffer.
     */
    byteLength(): number {
        return this.buffer.length;
    }

    /**
     * Reads an 8-bit unsigned integer from the current offset and advances the offset by 1.
     *
     * @returns The 8-bit unsigned integer value.
     */
    readUint8(): number {
        const value = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return value;
    }

    /**
     * Reads an 8-bit signed integer from the current offset and advances the offset by 1.
     *
     * @returns The 8-bit signed integer value.
     */
    readInt8(): number {
        const value = this.buffer.readInt8(this.offset);
        this.offset += 1;
        return value;
    }

    /**
     * Reads a 16-bit unsigned integer from the current offset and advances the offset by 2.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 16-bit unsigned integer value.
     */
    readUint16(littleEndian: boolean = true): number {
        const value = littleEndian ? this.buffer.readUInt16LE(this.offset) : this.buffer.readUInt16BE(this.offset);
        this.offset += 2;
        return value;
    }

    /**
     * Reads a 16-bit signed integer from the current offset and advances the offset by 2.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 16-bit signed integer value.
     */
    readInt16(littleEndian: boolean = true): number {
        const value = littleEndian ? this.buffer.readInt16LE(this.offset) : this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return value;
    }

    /**
     * Reads a 32-bit unsigned integer from the current offset and advances the offset by 4.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 32-bit unsigned integer value.
     */
    readUint32(littleEndian: boolean = true): number {
        const value = littleEndian ? this.buffer.readUInt32LE(this.offset) : this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    /**
     * Reads a 32-bit signed integer from the current offset and advances the offset by 4.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 32-bit signed integer value.
     */
    readInt32(littleEndian: boolean = true): number {
        const value = littleEndian ? this.buffer.readInt32LE(this.offset) : this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    /**
     * Reads a 64-bit unsigned integer from the current offset and advances the offset by 8.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 64-bit unsigned integer value as a BigInt.
     */
    readBigUint64(littleEndian: boolean = true): bigint {
        const value = littleEndian ? this.buffer.readBigUInt64LE(this.offset) : this.buffer.readBigUInt64BE(this.offset);
        this.offset += 8;
        return value;
    }

    /**
     * Reads a 64-bit signed integer from the current offset and advances the offset by 8.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 64-bit signed integer value as a BigInt.
     */
    readBigInt64(littleEndian: boolean = true): bigint {
        const value = littleEndian ? this.buffer.readBigInt64LE(this.offset) : this.buffer.readBigInt64BE(this.offset);
        this.offset += 8;
        return value;
    }

    /**
     * Reads a 32-bit floating-point number from the current offset and advances the offset by 4.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 32-bit floating-point number.
     */
    readFloat32(littleEndian: boolean = true): number {
        const value = littleEndian ? this.buffer.readFloatLE(this.offset) : this.buffer.readFloatBE(this.offset);
        this.offset += 4;
        return value;
    }

    /**
     * Reads a 64-bit floating-point number from the current offset and advances the offset by 8.
     *
     * @param littleEndian - Whether to read the value in little-endian format (default is true).
     * @returns The 64-bit floating-point number.
     */
    readFloat64(littleEndian: boolean = true): number {
        const value = littleEndian ? this.buffer.readDoubleLE(this.offset) : this.buffer.readDoubleBE(this.offset);
        this.offset += 8;
        return value;
    }

    /**
     * Reads a null-terminated string from the current offset and advances the offset past the null terminator.
     *
     * @returns The decoded string.
     */
    readString(): string {
        const start = this.offset;
        while (this.buffer[this.offset] !== 0x00 && this.offset < this.buffer.length) {
            this.offset++;
        }
        const end = this.offset;
        this.offset++; // Skip the null terminator
        return this.buffer.toString('utf-8', start, end);
    }

    /**
     * Gets the current offset.
     *
     * @returns The current offset.
     */
    getOffset(): number {
        return this.offset;
    }

    /**
     * Sets the current offset.
     *
     * @param offset - The new offset.
     */
    setOffset(offset: number): void {
        this.offset = offset;
    }

    /**
     * Skips a specified number of bytes.
     *
     * @param bytes - The number of bytes to skip.
     */
    skip(bytes: number): void {
        this.offset += bytes;
    }

    /**
     * Creates a new Buffer that references the same memory as the original,
     * but with a different start and end offset.
     *
     * @param start - The start offset (inclusive).
     * @param end - The end offset (exclusive). If not provided, defaults to the end of the buffer.
     * @returns A new Buffer representing the specified subarray.
     */
    subarray(start?: number, end?: number): Buffer {
        return this.buffer.subarray(start, end);
    }
}