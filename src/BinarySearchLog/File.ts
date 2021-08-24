import * as fs from "fs"
import * as util from "util"
export class File {
    /**
     *
     */
    private filehandle: number

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
    async read() {
        const read = util.promisify(fs.read)
        const chunkSize = 65536
        const buffer = Buffer.alloc(chunkSize)
        let currentLine = ""
        let result: {bytesRead: number}
        do {
            result = await read(this.filehandle, buffer, 0, chunkSize, null)
            const contents = currentLine + buffer.toString("utf8", 0, result.bytesRead)
            const lines = contents.split(/\n/)
            currentLine = lines.pop() || ""
            for(const line of lines) {
                const relativePosition = this.lineCheck(line)
                if(relativePosition > 0) {
                    return
                } else if(relativePosition == 0) {
                    process.stdout.write(line + "\n")
                }
            }
        } while(result.bytesRead > 0)
        const relativePosition = this.lineCheck(currentLine)
        if(relativePosition > 0) {
            return
        } else if(relativePosition == 0) {
            process.stdout.write(currentLine)
        }
    }
}