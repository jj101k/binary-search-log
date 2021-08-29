import * as fs from "fs"
import { File } from "./File"
export class Filename extends File {
    /**
     *
     * @param lineCheck This must return -1 for lines before the intended range,
     * 1 for lines after the intended range, and 0 for lines in range
     * @param filename
     */
    constructor(
        lineCheck: (line: string) => number,
        filename: string,
    ) {
        super(
            lineCheck,
            filename,
            fs.openSync(filename, "r")
        )
    }
}