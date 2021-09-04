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
        let testPosition = Math.round((before + after) / 2)
        do {
            const lineInfo = await this.firstLineInfoForwards(testPosition, after + 1)
            if(lineInfo.line === null) {
                if(before + 1 == testPosition) {
                    // No detected line, no further revision possible
                    break
                } else {
                    // No detected line, look earlier but keep after position
                    testPosition = Math.round((before + testPosition) / 2)
                }
            } else {
                testPosition += lineInfo.offset
                const state = this.lineCheck(lineInfo.line)
                if(lookEarlier(state)) {
                    after = testPosition
                } else {
                    before = testPosition
                }
                testPosition = Math.round((before + after) / 2)
            }
        } while(after > before + 1)

        return after
    }

    /**
     *
     * @param position
     * @param finishBeforePosition
     * @returns
     */
    private async firstLineInfoForwards(position: number, finishBeforePosition: number | null = null) {
        let currentPartialLine = ""
        do {
            const offset = position + currentPartialLine.length
            const contents = await this.readString(offset, finishBeforePosition)
            if(!contents) {
                return {
                    offset: 0,
                    line: (offset == this.fileLength - 1) ? currentPartialLine : null,
                }
            }
            currentPartialLine += contents
            const lines = currentPartialLine.split(this.capturingLineEnding)
            if(lines.length > 1 && position == 0) {
                return {
                    offset: 0,
                    line: lines[0],
                }
            } else if(lines.length > 3) {
                return {
                    offset: lines[0].length + lines[1].length,
                    line: lines[2],
                }
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
        do {
            const targetOffset = position - currentPartialLine.length - this.defaultChunkSize
            const contents = await this.readString(targetOffset)

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
     * Reads from the file.
     *
     * If you supply a negative offset, this will read as if it were literally
     * taking one block from there (ie, a short read) - this is to simplify
     * walking backwards.
     *
     * If you supply a finish-before position, the read will also be short -
     * this is to simplify walking forwards.
     *
     * @param startPosition This can be negative as noted above
     * @param finishBeforePosition The read will stop before this point
     * @returns
     */
    private async readString(startPosition: number, finishBeforePosition: number | null = null) {
        let position: number
        let size: number
        if(startPosition >= 0) {
            position = startPosition
            size = finishBeforePosition === null ?
                this.defaultChunkSize :
                (Math.min(finishBeforePosition, startPosition + this.defaultChunkSize) - startPosition)
        } else {
            position = 0
            size = startPosition + this.defaultChunkSize
        }
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
            // Last line is before range
            return
        }
        const {line: firstLine} = await this.firstLineInfoForwards(0)
        if(firstLine === null) {
            throw new Error(`Unable to find first line of ${this.filename}`)
        }
        const firstLinePosition = this.lineCheck(firstLine)
        if(firstLinePosition > 0) {
            // First line is after range
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

        let pos = fromPosition
        do {
            const block = await this.readString(pos, toPosition)
            yield block
            pos += block.length
        } while(pos < toPosition)
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
        if(remaining != "") {
            yield remaining
        }
    }
}