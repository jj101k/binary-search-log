import * as Errors from "../../Errors"
import { CommonLogFormat } from "./CommonLogFormat"
import { Syslog } from "./Syslog"
import { UniversalSortableLog } from "./UniversalSortableLog"
import { Base } from "./Base"

export class Factory {
    /**
     *
     */
    static dateHandlers: {[name: string]: {
        new(l: Date | null, h: Date | null, r?: Date): Base
    }} = {
        CommonLogFormat,
        Syslog,
        UniversalSortableLog,
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
}