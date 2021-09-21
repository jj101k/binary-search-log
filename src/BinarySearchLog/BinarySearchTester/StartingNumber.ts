import * as Errors from "../Errors"
import { Base } from "./Base"

export class StartingNumber extends Base<number> {
    linePattern = /^(\d+)/

    static description = "Handles lines which start with numbers (eg. timestamps)"

    /**
     * This must return -1 for lines before the intended range,
     * 1 for lines after the intended range, and 0 for lines in range
     *
     * @param line
     * @throws
     * @returns
     */
     getRelativeLinePosition(line: string) {
        let md
        if(md = line.match(this.linePattern)) {
            const n = +md[1]
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