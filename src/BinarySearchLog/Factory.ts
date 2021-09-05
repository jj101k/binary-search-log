import { DateSearcher, FileByByte, FileByLine } from ".";

export class Factory {
    /**
     *
     * @param by
     * @returns
     */
    public static getDateSearcher(by: "startingTimestamp" | "syslog") {
        const dateSearchers = {
            startingTimestamp: DateSearcher.StartingTimestamp,
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