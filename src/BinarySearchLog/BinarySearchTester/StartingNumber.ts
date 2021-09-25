import * as Errors from "../Errors"
import { Base } from "./Base"

export class StartingNumber extends Base<number> {
    linePattern = /^(\d+)/

    static description = "Handles lines which start with numbers (eg. timestamps)"

    getRelativeLinePosition(line: string, adjust = 0) {
        let md
        if(md = line.match(this.linePattern)) {
            let n = +md[1]
            if(adjust) {
                n = n + adjust
            }
            if(this.lowBound !== null && n < this.lowBound) {
                return -1
            } else if(this.highBound !== null && n > this.highBound) {
                return 1
            } else {
                return 0
            }
        }
        throw new Errors.Parser(`Unable to parse number on: "${line}"`)
    }
}