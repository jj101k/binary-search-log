import { CommonLogFormat } from "./CommonLogFormat"
import { Syslog } from "./Syslog"
import { UniversalSortableLog } from "./UniversalSortableLog"
import * as Errors from "../Errors"
import { Base } from "./Base"

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
        let proxy: Base<Date> | null = null
        const classes = [
            CommonLogFormat,
            Syslog,
            UniversalSortableLog,
        ]
        for(const c of classes) {
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