import * as Errors from "../../../Errors"
import { Base } from "../../Base"
import { Factory } from "../../Date/Factory"

export class DateAutodetectPerLine extends Base<Date> {
    static description = "As dateAutodetect, but does its thing on every line. Use if you have a mix of different line formats in there."

    linePattern = /.*/

    /**
     *
     * @param lowBound
     * @param highBound
     * @param referenceDate
     */
    constructor(lowBound: Date | null, highBound: Date | null, private referenceDate: Date | undefined) {
        super(lowBound, highBound)
    }

    getRelativeLinePosition(line: string, adjust = 0) {
        for(const c of Object.values(Factory.dateHandlers)) {
            const i = new c(this.lowBound, this.highBound, this.referenceDate)
            try {
                return i.getRelativeLinePosition(line, adjust)
            } catch(e) {
                // Skip it
            }
        }
        throw new Errors.InvalidFile(`Could not autodetect date on line: ${line}`)
    }
}