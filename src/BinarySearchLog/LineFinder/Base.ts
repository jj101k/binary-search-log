import * as fs from "fs"
import * as util from "util"
import * as BinarySearchTester from "../BinarySearchTester"
import * as Errors from "../Errors"
import { UNIXLine } from "../EOLPattern"
export abstract class Base {
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
    private openedFile: boolean

    /**
     *
     * @param lookEarlier
     * @returns
     */
    protected abstract findPosition(lookEarlier: (r: number) => boolean): Promise<number>

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
    protected get fileLength() {
        if(this.cachedFileLength === null) {
            const stat = fs.fstatSync(this.filehandle)
            this.cachedFileLength = stat.size
        }
        return this.cachedFileLength
    }

    /**
     *
     */
    protected readonly maxLineLength = 1024 * 1024

    /**
     *
     */
    protected filehandle: number

    /**
     *
     * @param position
     * @param finishBeforePosition
     * @returns
     */
    protected abstract firstLineInfoForwards(position: number, finishBeforePosition?: number | null): Promise<{offset: number, line: string | null}>

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