import * as fs from "fs"
import * as util from "util"
export class File {
    /**
     *
     */
    private filehandle: number

    /**
     *
     * @param filename
     * @param filehandle
     */
    constructor(private filename: string, filehandle?: number) {
        this.filehandle = filehandle || fs.openSync(filename, "r")
    }

    async read() {
        const read = util.promisify(fs.read)
        const chunkSize = 65536
        const buffer = Buffer.alloc(chunkSize)
        let result: {bytesRead: number}
        do {
            result = await read(this.filehandle, buffer, 0, chunkSize, null)
            process.stdout.write(buffer.toString("utf8", 0, result.bytesRead))
        } while(result.bytesRead > 0)
    }
}