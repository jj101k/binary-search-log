import { FileByByte, FileByLine } from ".";
import { UNIXLine } from "./EOLPattern";

export class Factory {
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