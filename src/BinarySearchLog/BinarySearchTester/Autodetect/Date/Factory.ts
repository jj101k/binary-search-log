import { Base as TesterBase } from "../../Base"
import { DateAutodetect } from "./DateAutodetect"
import { DateAutodetectPerLine } from "./DateAutodetectPerLine"
import { Factory as SpecificFactory } from "../../Date/Factory"

export class Factory {
    /**
     *
     */
    static generalDateHandlers: {[name: string]: {
        description: string,
        new(l: Date | null, h: Date | null, r?: Date): TesterBase<Date>
    }} = {
        DateAutodetect,
        DateAutodetectPerLine,
    }

    /**
     *
     * @param by
     * @throws
     * @returns
     */
    public static getGeneralSearchTester(by: string) {
        return this.generalDateHandlers[by] || SpecificFactory.getSearchTester(by)
    }
}