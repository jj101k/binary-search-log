import * as Errors from "../../../Errors"
import { Base } from "../../Base"
import { Factory } from "../../Date/Factory"

export class DateAutodetectPerLine extends Base<Date> {

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

    getRelativeLinePosition(line: string) {
        for(const c of Object.values(Factory.dateHandlers)) {
            const i = new c(this.lowBound, this.highBound, this.referenceDate)
            try {
                return i.getRelativeLinePosition(line)
            } catch(e) {
                // Skip it
            }
        }
        throw new Errors.InvalidFile(`Could not autodetect date on line: ${line}`)
    }
}