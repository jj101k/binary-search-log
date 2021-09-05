import { DateSearcher, FileByByte, FileByLine } from ".";
import { UNIXLine } from "./EOLPattern";

export class Factory {
    /**
     *
     * @param by
     * @returns
     */
    public static getDateSearcher(by: "syslog") {
        const dateSearchers = {
            syslog: DateSearcher.Syslog,
        }
        return dateSearchers[by]
    }

    /**
     *
     * @param by
     * @returns
     */
    public static getLineFinder(by: "byte" | "line" = "line") {
        const lineFinder = {
            byte: FileByByte,
            line: FileByLine,
        }
        return lineFinder[by]
    }
}