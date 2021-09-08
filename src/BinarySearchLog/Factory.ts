import { BinarySearchTester, LineFinder } from ".";

export class Factory {
    /**
     *
     * @param by
     * @returns
     */
    public static getBinarySearchDateTester(by: "syslog") {
        const binarySearchTesters = {
            syslog: BinarySearchTester.Syslog,
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