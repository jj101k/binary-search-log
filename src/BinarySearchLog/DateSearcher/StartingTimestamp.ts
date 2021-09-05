import { Base } from "./Base"

export class StartingTimestamp extends Base {
    linePattern = /^(\d+)/

    protected sanitise(dateIn: string) {
        return dateIn
    }

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
            if(n < this.lowBound.valueOf()) {
                return -1
            } else if(n > this.highBound.valueOf()) {
                return 1
            } else {
                return 0
            }
        }
        throw new Error(`Unable to parse date on: "${line}"`)
    }
}