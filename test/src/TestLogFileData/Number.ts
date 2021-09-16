import * as fs from "fs"
import { Base } from "./Base"

export class Number extends Base {
    logType = "number"
    /**
     * Create the file
     */
    build() {
        this.initTemporaryDirectory()
        console.log(`Creating large file ${this.filename}`)

        const start = new Date()
        const fileHandle = fs.openSync(this.filename!, "w")
        for(let i = 0; i < this.lines / this.writeBlockLines; i++) {
            let block = ""
            for(let j = 0; j < this.writeBlockLines; j++) {
                let n = i * this.writeBlockLines + j + 1
                if(n > this.lines) {
                    break
                }
                block += `${n} ${this.getContent(n)}\n`
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