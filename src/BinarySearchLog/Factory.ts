import * as LineFinder from "./LineFinder"
import * as BinarySearchTester from "./BinarySearchTester"

export class Factory {
    /**
     *
     * @param by
     * @returns
     */
    public static getBinarySearchDateTester(by: "syslog" | "universalSortableLog") {
        const binarySearchTesters = {
            syslog: BinarySearchTester.Syslog,
            universalSortableLog: BinarySearchTester.UniversalSortableLog,
        }
        return binarySearchTesters[by]
    }

    /**
     *
     * @param by
     * @returns
     */
    public static getBinarySearchNumberTester(by: "startingTimestamp") {
        const binarySearchTesters = {
            startingTimestamp: BinarySearchTester.StartingTimestamp,
        }
        return binarySearchTesters[by]
    }

    /**
     *
     * @param by
     * @returns
     */
    public static getLineFinder(by: "byte" | "line" = "line") {
        const lineFinder = {
            byte: LineFinder.ByByte,
            line: LineFinder.ByLine,
        }
        return lineFinder[by]
    }
}