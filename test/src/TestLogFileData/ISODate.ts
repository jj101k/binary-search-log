import * as fs from "fs"
import { Base } from "./Base"

export class ISODate extends Base {
    logType = "isoDate"

    /**
     * Create the file
     */
    build() {
        this.initTemporaryDirectory()
        console.log(`Creating large file ${this.filename}`)

        const start = new Date()
        const fileHandle = fs.openSync(this.filename!, "w")
        const lineDate = new Date("2000-01-01")
        for(let i = 0; i < this.lines / this.writeBlockLines; i++) {
            let block = ""
            for(let j = 0; j < this.writeBlockLines; j++) {
                const offset = i * this.writeBlockLines + j + 1
                if(offset > this.lines) {
                    break
                }
                block += `${lineDate.toISOString()} ${this.getContent(offset)}\n`
                lineDate.setHours(lineDate.getHours() + 1)
            }
            fs.writeSync(fileHandle, block)
        }
        fs.closeSync(fileHandle)
        const finish = new Date()
        const elapsedMs = finish.valueOf() - start.valueOf()
        const stat = fs.statSync(this.filename!)
        console.log(`Finished creating file after ${elapsedMs}ms, size is ${(stat.size / 1024 / 1024).toFixed(1)}MB`)
    }
}