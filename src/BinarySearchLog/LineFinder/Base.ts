import * as fs from "fs"
import * as util from "util"
import * as BinarySearchTester from "../BinarySearchTester"
import * as Errors from "../Errors"
import { UNIXLine } from "../EOLPattern"
import { LineInfo } from "./LineInfo"

export abstract class Base {
    /**
     *
     */
    private buffer: Buffer

    /**
     *
     */
    private cachedFileLength: number | null = null

    /**
     *
     */
    private readonly defaultChunkSize = 65536

    /**
     *
     */
    private openedFile: boolean

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
        throw new Errors.LimitExceeded("Maximum line length exceeded")
    }

    /**
     *
     */
    protected filehandle: number

    /**
     *
     */
    protected readonly maxLineLength = 1024 * 1024

    /**
     *
     */
    protected get fileLength() {
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
    protected async findPosition(lookEarlier: (r: number) => boolean) {
        let before = -1
        let after = this.fileLength
        let lineCeiling = after
        let testPosition = Math.round((before + after) / 2)
        do {
            const lineInfo = await this.firstLineInfoGivenCeiling(testPosition, lineCeiling)
            if(lineInfo.line === null) {
                if(before + 1 == testPosition) {
                    // No detected line, no further revision possible
                    break
                } else {
                    // No detected line, look earlier but keep after position
                    testPosition = Math.round((before + testPosition) / 2)
                }
            } else {
                const state = this.binarySearchTester.getRelativeLinePosition(lineInfo.line)
                if(lookEarlier(state)) {
                    after = testPosition
                    lineCeiling = this.lineCeiling(testPosition, lineInfo)
                } else {
                    before = testPosition
                }
                testPosition = Math.round((before + after) / 2)
            }
        } while(after > before + 1)

        return lineCeiling
    }

    /**
     *
     * @param position
     * @param finishBeforePosition
     * @returns
     */
    protected async firstLineInfoForwards(position: number, finishBeforePosition: number | null = null): Promise<LineInfo> {
        let currentPartialLine = ""
        do {
            const offset = position + currentPartialLine.length
            const contents = await this.readString(offset, finishBeforePosition)
            if(!contents) {
                return {
                    offset: 0,
                    line: (position == 0 && (offset == this.fileLength - 1 || offset == this.fileLength)) ? currentPartialLine : null,
                }
            }
            currentPartialLine += contents
            const lines = currentPartialLine.split(this.capturingLineEnding)
            if(lines.length > 1 && position == 0) {
                // This is (line) \n at BOF
                return {
                    offset: 0,
                    line: lines[0],
                }
            } else if(
                lines.length > 3 ||
                (
                    lines.length > 1 &&
                    position + currentPartialLine.length >= this.fileLength &&
                    lines[2].length > 0
                )
            ) {
                // This is (part) \n (line) \n (line)
                // or (line) \n (line) \n ""
                // or (part) \n (line) at EOF
                //
                // Note that this is NOT (part) \n "" at EOF
                return {
                    offset: lines[0].length + lines[1].length,
                    line: lines[2],
                }
            }
        } while(currentPartialLine.length < this.maxLineLength)
        throw new Errors.LimitExceeded("Maximum line length exceeded")
    }

    /**
     * This is a little different to firstLineInfoForwards in that whether the
     * ceiling is used is optional.
     *
     * @param startPosition
     * @param ceiling
     */
    protected abstract firstLineInfoGivenCeiling(startPosition: number, ceiling: number): Promise<LineInfo>

    /**
     * This returns `position` as adjusted to the effective floor or ceiling position.
     *
     * @param position
     * @param lineInfo
     */
    protected abstract lineCeiling(position: number, lineInfo: LineInfo): number

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
    protected async readString(startPosition: number, finishBeforePosition: number | null = null) {
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
     * @param binarySearchTester
     * @param filename
     * @param capturingLineEnding
     * @param filehandle
     */
    constructor(
        protected binarySearchTester: BinarySearchTester.Base<any>,
        private filename: string,
        protected capturingLineEnding: RegExp = UNIXLine,
        filehandle: number | null = null,
    ) {
        this.buffer = Buffer.alloc(this.defaultChunkSize)
        if(filehandle) {
            this.filehandle = filehandle
            this.openedFile = false
        } else {
            this.filehandle = fs.openSync(this.filename, "r")
            this.openedFile = true
        }
    }

    /**
     * Releases the filehandle
     */
    finish() {
        if(this.openedFile) {
            fs.close(this.filehandle)
        }
    }

    /**
     * This reads all the lines in range, as a series of blocks
     */
    async *read() {
        if(this.fileLength == 0) {
            // No lines
            return
        }
        const lastLine = await this.readLastLineBackwards(this.fileLength)
        if(lastLine.length == 0) {
            throw new Errors.InvalidFile("Last line is empty")
        }
        const lastLineRelativePosition = this.binarySearchTester.getRelativeLinePosition(lastLine)
        if(lastLineRelativePosition < 0) {
            // Last line is before range
            return
        }
        const {line: firstLine} = await this.firstLineInfoForwards(0)
        if(firstLine === null) {
            throw new Errors.InvalidFile(`Unable to find first line of ${this.filename}`)
        }
        if(firstLine.length == 0) {
            throw new Errors.InvalidFile("First line is empty")
        }
        const firstLinePosition = this.binarySearchTester.getRelativeLinePosition(firstLine)
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