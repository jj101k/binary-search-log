import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export class TestLogFileData {
    private readonly writeBlockLines = 10_000
    private temporaryDirectory: string | undefined

    /**
     *
     * @param lines The number of lines to create
     */
    constructor(public lines: number) {

    }

    /**
     * The full path to the file. Only available after/during build()
     */
    get filename() {
        if(this.temporaryDirectory) {
            return `${this.temporaryDirectory}/range1-${this.lines}.log.example`
        } else {
            return undefined
        }
    }

    /**
     * Create the file
     */
    build() {
        const osTempPath = os.tmpdir()
        this.temporaryDirectory = fs.mkdtempSync(`${osTempPath}${path.sep}`)
        console.log(`Creating large file ${this.filename}`)

        const start = new Date()
        const fileHandle = fs.openSync(this.filename!, "w")
        for(let i = 0; i < this.lines / this.writeBlockLines; i++) {
            let block = ""
            for(let j = 0; j < this.writeBlockLines; j++) {
                let timestamp = i * this.writeBlockLines + j + 1
                if(timestamp > this.lines) {
                    break
                }
                block += `${timestamp} ${"#".repeat(timestamp % 256)}\n`
            }
            fs.writeSync(fileHandle, block)
        }
        fs.closeSync(fileHandle)
        const finish = new Date()
        const elapsedMs = finish.valueOf() - start.valueOf()
        const stat = fs.statSync(this.filename!)
        console.log(`Finished creating file after ${elapsedMs}ms, size is ${(stat.size / 1024 / 1024).toFixed(1)}MB`)
    }

    /**
     * Clean up the file
     */
    finish() {
        if(this.filename) {
            fs.rmSync(this.filename)
        }
        if(this.temporaryDirectory) {
            fs.rmdirSync(this.temporaryDirectory)
        }
    }
}