import * as fs from "fs"
import * as util from "util"
import { UNIXLine } from "./EOLPattern"
export class File {
    /**
     *
     */
    private buffer: Buffer

    /**
     *
     */
    private readonly defaultChunkSize = 65536

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
     */
    private readonly maxLineLength = 1024 * 1024

    /**
     *
     * @param lookEarlier
     * @returns
     */
    private async findPosition(lookEarlier: (r: number) => boolean) {
        let before = -1
        let after = this.fileLength
        let testPosition: number
        do {
            testPosition = Math.round((before + after) / 2)
            const line = await this.readFirstLineForwards(testPosition)
            const state = this.lineCheck(line)
            if(lookEarlier(state)) {
                after = testPosition
            } else {
                before = testPosition
            }
        } while(after > before + 1)

        /*
         * @todo this should really filter to the line offsets and instead abort
         * once there is only one line boundary left
         */

        const position = after
        const contents = await this.readString(position)
        const lines = contents.split(this.capturingLineEnding, 2)

        return position + lines[0].length + lines[1].length
    }

    /**
     *
     * @param position
     * @returns
     */
    private async readFirstLineForwards(position: number) {
        let currentPartialLine = ""
        do {
            const offset = position + currentPartialLine.length
            const contents = await this.readString(offset)
            if(!contents) {
                return currentPartialLine
            }
            currentPartialLine += contents
            const lines = currentPartialLine.split(this.capturingLineEnding)
            if(lines.length > 1 && position == 0) {
                return lines[0]
            } else if(lines.length > 3) {
                return lines[2]
            }
        } while(currentPartialLine.length < this.maxLineLength)
        throw new Error("Maximum line length exceeded")
    }

    /**
     *
     * @param position
     * @returns
     */
    private async readLastLineBackwards(position: number) {
        let currentPartialLine = ""
        const chunkSize = this.defaultChunkSize
        do {
            const targetOffset = position - currentPartialLine.length - chunkSize
            let contents: string
            if(targetOffset >= 0) {
                contents = await this.readString(targetOffset, chunkSize)
            } else {
                contents = await this.readString(0, chunkSize + targetOffset)
            }
            currentPartialLine = contents + currentPartialLine
            const lines = currentPartialLine.split(this.capturingLineEnding)
            if(lines.length > 2) {
                return lines[lines.length - 1] || lines[lines.length - 3]
            } else if(targetOffset <= 0) {
                return lines[0]
            }
        } while(currentPartialLine.length < this.maxLineLength)
        throw new Error("Maximum line length exceeded")
    }

    /**
     *
     * @param position
     * @param size
     * @returns
     */
    private async readString(position: number, size = this.defaultChunkSize) {
        const read = util.promisify(fs.read)
        const result = await read(this.filehandle, this.buffer, 0, size, position)
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
        this.buffer = Buffer.alloc(this.defaultChunkSize)
    }

    /**
     * This reads all the lines in range, as a series of blocks
     */
    async *read() {
        const lastLineRelativePosition = this.lineCheck(await this.readLastLineBackwards(this.fileLength))
        if(lastLineRelativePosition < 0) {
            console.info(`Last line is before range in ${this.filename}`)
            return
        }
        const firstLine = await this.readFirstLineForwards(0)
        if(!firstLine) {
            throw new Error(`Unable to find first line of ${this.filename}`)
        }
        const firstLinePosition = this.lineCheck(firstLine)
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
            yield await this.readString(pos, size)
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
}