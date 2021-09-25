import * as Errors from "../../Errors"
import { Base as AnyBase } from "../Base"

export abstract class Base extends AnyBase<Date> {
    /**
     *
     */
    protected referenceDate: Date

    protected abstract sanitise(dateString: string): string

    /**
     *
     * @param lowBound
     * @param highBound
     * @param referenceDate
     */
    constructor(lowBound: Date | null, highBound: Date | null, referenceDate?: Date) {
        super(lowBound, highBound)
        const bestReferenceDate = referenceDate ?? lowBound ?? highBound
        if(bestReferenceDate) {
            this.referenceDate = bestReferenceDate
        } else {
            throw new Errors.Arguments(`Cannot start a date searcher without a reference date`)
        }
    }

    getRelativeLinePosition(line: string, adjust = 0) {
        let md
        if(md = line.match(this.linePattern)) {
            const d = new Date(this.sanitise(md[1]))
            if(adjust) {
                d.setSeconds(d.getSeconds() + adjust)
            }
            if(this.lowBound !== null && d < this.lowBound) {
                return -1
            } else if(this.highBound !== null && d > this.highBound) {
                return 1
            }
            return 0
        }
        throw new Errors.Parser(`Unable to parse date on: "${line}"`)
    }
}