import * as Errors from "../../Errors"
import { CommonLogFormat } from "./CommonLogFormat"
import { Syslog } from "./Syslog"
import { UniversalSortableLog } from "./UniversalSortableLog"
import { Base } from "./Base"
import { Base as TesterBase } from "../Base"
import { DateAutodetect } from "./DateAutodetect"
import { DateAutodetectPerLine } from "./DateAutodetectPerLine"

export class Factory {
    /**
     *
     */
    static dateHandlers: {[name: string]: {new(l: Date | null, h: Date | null, r?: Date): Base}} = {
        CommonLogFormat,
        Syslog,
        UniversalSortableLog,
    }

    /**
     *
     */
    static generalDateHandlers: {[name: string]: {new(l: Date | null, h: Date | null, r?: Date): TesterBase<Date>}} = {
        DateAutodetect,
        DateAutodetectPerLine,
    }

    /**
     *
     * @param by
     * @throws
     * @returns
     */
    public static getSearchTester(by: string) {
        const c = Factory.dateHandlers[by]
        if(!c) {
            throw new Errors.Arguments(`No binary search tester named ${by}`)
        }
        return c
    }

    /**
     *
     * @param by
     * @throws
     * @returns
     */
    public static getGeneralSearchTester(by: string) {
        return Factory.generalDateHandlers[by] || this.getSearchTester(by)
    }
}