import * as fs from "fs"
import * as util from "util"
import { UNIXLine } from "./EOLPattern"
export class File {
    /**
     *
     */
    private buffer: Buffer | undefined

    /**
     *
     */
    private defaultChunkSize = 65536

    /**
     *
     */
    private cachedFileLength: number | null = null

    /**
     *
     */
    private get fileLength() {
        if(this.cachedFileLength === null) {
            const stat = fs.fstatSync(this.filehandle)
            this.cachedFileLength = stat.size
        }
        return this.cachedFileLength
    }

    /**
     *
     * @param lookEarlier
     * @returns
     */
    private async findPosition(lookEarlier: (r: number) => boolean) {
        let before = -1
        let after = this.fileLength
        let testPosition: number
        let chunkSize = this.defaultChunkSize
        do {
            testPosition = Math.round((before + after) / 2)
            const contents = await this.readString(chunkSize, testPosition)
            const lines = contents.split(this.capturingLineEnding, 3)
            if(lines.length > 2) {
                const state = this.lineCheck(lines[2])
                if(lookEarlier(state)) {
                    after = testPosition
                } else {
                    before = testPosition
                }
                chunkSize = this.defaultChunkSize
            } else {
                if(testPosition + chunkSize > this.fileLength) {
                    after = testPosition
                    chunkSize = this.defaultChunkSize
                } else {
                    chunkSize *= 2
                }
            }
        } while(after > before + 1)

        /*
         * @todo this should really filter to the line offsets and instead abort
         * once there is only one line boundary left
         */

        const position = after
        const contents = await this.readString(chunkSize, position)
        const lines = contents.split(this.capturingLineEnding, 2)

        return position + lines[0].length + lines[1].length
    }

    /**
     *
     * @param size
     * @param position
     * @returns
     */
    private readData(size: number, position: number) {
        if(
            !this.buffer ||
            this.buffer.length < size ||
            this.buffer.length > Math.max(size * 2, this.defaultChunkSize)
        ) {
            this.buffer = Buffer.alloc(size)
        }
        const read = util.promisify(fs.read)
        return read(this.filehandle, this.buffer, 0, size, position)
    }

    /**
     *
     * @param size
     * @param position
     * @returns
     */
    private async readString(size: number, position: number) {
        const result = await this.readData(size, position)
        return result.buffer.toString("utf8", 0, result.bytesRead)
    }

    /**
     *
     * @param lineCheck This must return -1 for lines before the intended range,
     * 1 for lines after the intended range, and 0 for lines in range
     * @param filename
     * @param filehandle
     * @param capturingLineEnding
     */
    constructor(
        private lineCheck: (line: string) => number,
        private filename: string,
        protected filehandle: number,
        private capturingLineEnding: RegExp = UNIXLine,
    ) {
    }

    /**
     * This reads all the lines in range, as a series of blocks
     */
    async *read() {
        const lastLineRelativePosition = await this.lastLineRelativePosition()
        if(lastLineRelativePosition < 0) {
            console.info(`Last line is before range in ${this.filename}`)
            return
        }
        const firstLinePosition = await this.firstLineRelativePosition()
        if(firstLinePosition > 0) {
            console.info(`First line is after range in ${this.filename}`)
            return
        }

        let toPosition: number | null
        if(lastLineRelativePosition > 0) {
            // Find finish
            toPosition = await this.findPosition(state => state > 0)
        } else {
            // end at the end
            toPosition = this.fileLength
        }
        let fromPosition: number | null
        if(firstLinePosition < 0) {
            // Find start
            fromPosition = await this.findPosition(state => state >= 0)
        } else {
            // Start from zero
            fromPosition = 0
        }

        const chunkSize = this.defaultChunkSize

        for(let pos = fromPosition; pos < toPosition; pos += chunkSize) {
            const size = Math.min(toPosition, pos + chunkSize) - pos
            yield await this.readString(size, pos)
        }
    }

    /**
     * This reads all the lines in range, as a series of lines
     */
    async *readLines() {
        let remaining = ""
        for await (const block of this.read()) {
            const contents = remaining + block
            const lines = contents.split(this.capturingLineEnding)
            remaining = lines.pop() ?? ""
            for(let i = 0; i < lines.length; i += 2) {
                yield lines[i] + lines[i + 1]
            }
        }
    }

    private async firstLineRelativePosition() {
        let currentPartialLine = ""
        let nextPosition = 0
        const chunkSize = this.defaultChunkSize
        let line: string | undefined
        do {
            const result = await this.readData(chunkSize, nextPosition)
            if(result.bytesRead == 0) {
                if(currentPartialLine.length) {
                    line = currentPartialLine
                    break
                } else {
                    throw new Error(`Unable to find first line of ${this.filename}`)
                }
            }
            const contents = currentPartialLine + result.buffer.toString("utf8", 0, result.bytesRead)
            const lines = contents.split(this.capturingLineEnding)
            nextPosition += result.bytesRead
            currentPartialLine = lines.pop() || ""
            line = lines.shift()
        } while(!line)

        return this.lineCheck(line)
    }

    private async lastLineRelativePosition() {
        const lastLineEstimatedLength = 1024

        let chunkSize = lastLineEstimatedLength
        do {
            const offset = Math.max(this.fileLength - chunkSize, 0)
            const contents = await this.readString(chunkSize, offset)
            const lines = contents.split(this.capturingLineEnding)
            if(lines.length > 2) {
                return this.lineCheck(lines[lines.length - 1] || lines[lines.length - 3])
            }
            chunkSize *= 2
        } while(chunkSize < this.fileLength * 2)
        throw new Error(`Unable to find last line of ${this.filename}`)
    }
}