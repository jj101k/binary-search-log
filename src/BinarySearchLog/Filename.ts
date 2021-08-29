import * as fs from "fs"
import { File } from "./File"
export class Filename extends File {
    /**
     * If you use this class, you must call .finish() when done to release the filehandle.
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

    /**
     * Releases the filehandle
     */
    finish() {
        fs.close(this.filehandle)
    }
}