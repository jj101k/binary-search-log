import * as fs from "fs"
import * as util from "util"
export class File {
    /**
     *
     */
    private filehandle: number

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
        filehandle?: number,
    ) {
        this.filehandle = filehandle || fs.openSync(this.filename, "r")
    }

    /**
     *
     */
    private async readSubsequentLine() {
        if(!this.currentBlockLines.length) {
            const read = util.promisify(fs.read)
            const chunkSize = 65536
            const buffer = Buffer.alloc(chunkSize)
            do {
                const result = await read(this.filehandle, buffer, 0, chunkSize, null)
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