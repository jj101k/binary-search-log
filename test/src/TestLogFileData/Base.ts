import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export abstract class Base {
    protected abstract readonly logType: string
    protected readonly writeBlockLines = 10_000

    protected getContent(offset: number) {
        if(this.randomLineLengths) {
            return "#".repeat(Math.floor(Math.random() * 256))
        } else {
            return "#".repeat(offset % 256)
        }
    }

    protected initTemporaryDirectory() {
        if(!this.temporaryDirectory) {
            const osTempPath = os.tmpdir()
            this.temporaryDirectory = fs.mkdtempSync(`${osTempPath}${path.sep}`)
        }
    }

    /**
     *
     * @param lines The number of lines to create
     * @param temporaryDirectory
     * @param randomLineLengths
     */
    constructor(public lines: number, protected temporaryDirectory?: string, private randomLineLengths: boolean = false) {
    }

    /**
     * The full path to the file. Only available after/during build()
     */
    get filename() {
        if(this.temporaryDirectory) {
            return `${this.temporaryDirectory}/range1-${this.lines}.${this.logType}.example`
        } else {
            return undefined
        }
    }

    /**
     * Create the file
     */
    abstract build(): void

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