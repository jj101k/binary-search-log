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
        let nextPosition: number | null
        if(position !== null) {
            this.currentBlockLines = []
            this.currentPartialLine = ""
        }
        nextPosition = position
        if(!this.currentBlockLines.length) {
            const read = util.promisify(fs.read)
            const chunkSize = 65536
            const buffer = Buffer.alloc(chunkSize)
            do {
                const result = await read(this.filehandle, buffer, 0, chunkSize, nextPosition)
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
                if(nextPosition) {
                    nextPosition = null
                    lines.shift()
                }
                this.currentPartialLine = lines.pop() || ""
                this.currentBlockLines = lines
            } while(this.currentBlockLines.length == 0)
        }
        return this.currentBlockLines.shift()!
    }

    /**
     *
     */
    async read() {
        if(this.firstLineIsInRange() && this.lastLineIsInRange()) {
            let line: string | null
            do {
                line = await this.readSubsequentLine()
                if(line !== null) {
                    const relativePosition = this.lineCheck(line)
                    if(relativePosition > 0) {
                        return
                    } else if(relativePosition == 0) {
                        process.stdout.write(line + "\n")
                    }
                }
            } while(line !== null)
        }
    }

    private async firstLineIsInRange() {
        const line = await this.readSubsequentLine(0)
        if(line !== null) {
            const relativePosition = this.lineCheck(line)
            return relativePosition <= 0
        } else {
            return false
        }
    }

    private async lastLineIsInRange() {
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
            const relativePosition = this.lineCheck(lastLine)
            return relativePosition >= 0
        }
    }
}