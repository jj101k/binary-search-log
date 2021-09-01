import * as fs from "fs"
import * as util from "util"
export class File {
    /**
     *
     */
    private currentBlockLines: string[] = []

    /**
     *
     */
    private currentPartialLine: string = ""

    /**
     *
     */
    private defaultChunkSize = 65536

    /**
     *
     */
    private nextPosition = 0

    /**
     *
     * @param lineCheck This must return -1 for lines before the intended range,
     * 1 for lines after the intended range, and 0 for lines in range
     * @param filename
     * @param filehandle
     * @param lineEnding
     */
    constructor(
        private lineCheck: (line: string) => number,
        private filename: string,
        protected filehandle: number,
        private lineEnding: RegExp = /\n/,
    ) {
    }

    /**
     *
     * @param position
     */
    private async readSubsequentLine(position: number | null = null) {
        if(position !== null) {
            this.currentBlockLines = []
            this.currentPartialLine = ""
            this.nextPosition = position
        }
        if(!this.currentBlockLines.length) {
            const read = util.promisify(fs.read)
            const chunkSize = this.defaultChunkSize
            const buffer = Buffer.alloc(chunkSize)
            let i = 0
            do {
                const result = await read(this.filehandle, buffer, 0, chunkSize, this.nextPosition)
                if(result.bytesRead == 0) {
                    if(this.currentPartialLine.length) {
                        const line = this.currentPartialLine
                        this.currentPartialLine = ""
                        return line
                    } else {
                        return null
                    }
                }
                const contents = this.currentPartialLine + buffer.toString("utf8", 0, result.bytesRead)
                const lines = contents.split(this.lineEnding)
                if(i == 0 && this.nextPosition > 0) {
                    lines.shift()
                }
                this.nextPosition += result.bytesRead
                i++
                this.currentPartialLine = lines.pop() || ""
                this.currentBlockLines = lines
            } while(this.currentBlockLines.length == 0)
        }
        return this.currentBlockLines.shift()!
    }

    /**
     *
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
        let fromPosition: number | null
        if(firstLinePosition < 0) {
            // Find start
            const stat = fs.fstatSync(this.filehandle)

            const read = util.promisify(fs.read)
            let before = -1
            let after = stat.size
            let testPosition: number
            let chunkSize = this.defaultChunkSize
            do {
                testPosition = Math.round((before + after) / 2)
                const buffer = Buffer.alloc(chunkSize)
                const result = await read(this.filehandle, buffer, 0, chunkSize, testPosition)
                const contents = this.currentPartialLine + buffer.toString("utf8", 0, result.bytesRead)
                const lines = contents.split(this.lineEnding, 2)
                if(lines.length > 1) {
                    const state = this.lineCheck(lines[1])
                    if(state >= 0) {
                        after = testPosition
                    } else {
                        before = testPosition
                    }
                    chunkSize = this.defaultChunkSize
                } else {
                    if(testPosition + chunkSize > stat.size) {
                        after = testPosition
                        chunkSize = this.defaultChunkSize
                    } else {
                        chunkSize *= 2
                    }
                }
            } while(after > before + 1)
            fromPosition = before
        } else {
            // Start from zero
            fromPosition = 0
        }
        let line: string | null
        do {
            line = await this.readSubsequentLine(fromPosition)
            if(fromPosition !== null) {
                fromPosition = null
            }
            if(line !== null) {
                const relativePosition = this.lineCheck(line)
                if(relativePosition > 0) {
                    return
                } else if(relativePosition == 0) {
                    yield line + "\n"
                }
            }
        } while(line !== null)
    }

    private async firstLineRelativePosition() {
        const line = await this.readSubsequentLine(0)
        if(line === null) {
            throw new Error(`Unable to find first line of ${this.filename}`)
        }
        return this.lineCheck(line)
    }

    private async lastLineRelativePosition() {
        const lastLineEstimatedLength = 1024
        const stat = fs.fstatSync(this.filehandle)

        const read = util.promisify(fs.read)
        let chunkSize = lastLineEstimatedLength
        do {
            const buffer = Buffer.alloc(chunkSize)
            const result = await read(this.filehandle, buffer, 0, chunkSize, Math.max(stat.size - 1 - chunkSize, 0))
            const contents = this.currentPartialLine + buffer.toString("utf8", 0, result.bytesRead)
            let md: RegExpMatchArray | null
            if(md = contents.match(/\n(.+\n?)$/)) {
                return this.lineCheck(md[1])
            }
            chunkSize *= 2
        } while(chunkSize < stat.size * 2)
        throw new Error(`Unable to find last line of ${this.filename}`)
    }
}