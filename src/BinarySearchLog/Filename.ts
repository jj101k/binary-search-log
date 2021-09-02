import * as fs from "fs"
import { EOLPattern } from "."
import { File } from "./File"
export class Filename extends File {
    /**
     * If you use this class, you must call .finish() when done to release the filehandle.
     *
     * @param lineCheck This must return -1 for lines before the intended range,
     * 1 for lines after the intended range, and 0 for lines in range
     * @param filename
     * @param capturingLineEnding
     */
    constructor(
        lineCheck: (line: string) => number,
        filename: string,
        capturingLineEnding: RegExp = EOLPattern.UNIXLine,
    ) {
        super(
            lineCheck,
            filename,
            fs.openSync(filename, "r"),
            capturingLineEnding
        )
    }

    /**
     * Releases the filehandle
     */
    finish() {
        fs.close(this.filehandle)
    }
}