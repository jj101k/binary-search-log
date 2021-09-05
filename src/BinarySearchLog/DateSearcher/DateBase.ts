import { Base } from "./Base"

export abstract class DateBase extends Base {
    protected abstract sanitise(dateString: string): string

    getRelativeLinePosition(line: string) {
        let md
        if(md = line.match(this.linePattern)) {
            const d = new Date(this.sanitise(md[1]))
            if(d < this.lowBound) {
                return -1
            } else if(d > this.highBound) {
                return 1
            }
            return 0
        }
        throw new Error(`Unable to parse date on: "${line}"`)
    }
}