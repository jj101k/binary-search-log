import * as Errors from "../../../Errors"
import { Base } from "../../Base"
import { Factory } from "../../Date/Factory"

export class DateAutodetect extends Base<Date> {
    static description = "Detect which other handler to use"

    /**
     *
     */
    private proxy: Base<Date> | null = null

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
        if(!this.proxy) {
            for(const c of Object.values(Factory.dateHandlers)) {
                const i = new c(this.lowBound, this.highBound, this.referenceDate)
                try {
                    i.getRelativeLinePosition(line)
                    this.proxy = i
                    break
                } catch(e) {
                    // Skip it
                }
            }
            if(!this.proxy) {
                throw new Errors.InvalidFile(`Could not autodetect date on line: ${line}`)
            }
        }
        return this.proxy.getRelativeLinePosition(line)
    }
}