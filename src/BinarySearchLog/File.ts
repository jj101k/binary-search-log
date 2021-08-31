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
    private nextPosition = 0

    /**
     *
     * @param lineCheck This must return -1 for lines before the intended range,
     * 1 for lines after the intended range, and 0 for lines in range
     * @param filename
     * @param filehandle
     */
    constructor(
        private lineCheck: (line: string) => number,
        private filename: string,
        protected filehandle: number,
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
            const chunkSize = 65536
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
                const lines = contents.split(/\n/)
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
        let fromPosition: number | null = 0
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
        const lastLineOffset = lastLineEstimatedLength
        let secondToLastLine: string | null = null
        const stat = fs.fstatSync(this.filehandle)
        const fileLength = stat.blocks * stat.blksize
        while(secondToLastLine === null && lastLineOffset < fileLength) {
            secondToLastLine = await this.readSubsequentLine(fileLength - lastLineOffset)
        }
        if(secondToLastLine !== null) {
            let lastLine: string | null = null
            do {
                lastLine = await this.readSubsequentLine()
            } while(lastLine === null)
            return this.lineCheck(lastLine)
        }
        throw new Error(`Unable to find last line of ${this.filename}`)
    }
}