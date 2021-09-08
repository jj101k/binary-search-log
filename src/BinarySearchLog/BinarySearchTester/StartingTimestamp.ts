import { Base } from "./Base"

export class StartingTimestamp extends Base<number> {
    linePattern = /^(\d+)/

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
        throw new Error(`Unable to parse timestamp on: "${line}"`)
    }
}