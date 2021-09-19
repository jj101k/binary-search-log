import * as Errors from "../Errors"
import { Base } from "./Base"
export class ByByte extends Base {
    /**
     *
     * @param lookEarlier
     * @returns
     */
    protected async findPosition(lookEarlier: (r: number) => boolean) {
        let before = -1
        let after = this.fileLength
        let testPosition = Math.round((before + after) / 2)

        do {
            const {line: line} = await this.firstLineInfoForwards(testPosition)
            if(line === null) {
                if(before + 1 == testPosition) {
                    // No detected line, no further revision possible
                    break
                } else {
                    // No detected line, look earlier but keep after position
                    testPosition = Math.round((before + testPosition) / 2)
                }
            } else {
                const state = this.binarySearchTester.getRelativeLinePosition(line)
                if(lookEarlier(state)) {
                    after = testPosition
                } else {
                    before = testPosition
                }
                testPosition = Math.round((before + after) / 2)
            }
        } while(after > before + 1)

        /*
         * This reads forward one line on finish, because the quirks
         * of looking for the first COMPLETE line mean that this will
         * always produce a result which is one line early.
         *
         * Note: This won't work correctly for position=0, but if the first line
         * is in range the test for start position won't be performed, and if
         * the first line is at the end of the range the result for the
         * end-of-range search will be position=1. If this really bothers you
         * you can say `if(position == 0) return position`, but it won't
         * actually ever run.
         */

        const position = after
        const contents = await this.readString(position)
        const lines = contents.split(this.capturingLineEnding, 2)

        return position + lines[0].length + lines[1].length
    }

    /**
     *
     * @param position
     * @param finishBeforePosition
     * @returns
     */
    protected async firstLineInfoForwards(position: number, finishBeforePosition: number | null = null) {
        let currentPartialLine = ""
        do {
            const offset = position + currentPartialLine.length
            const contents = await this.readString(offset, finishBeforePosition)
            if(!contents) {
                return {
                    offset: 0,
                    line: (position == 0 && (offset == this.fileLength - 1 || offset == this.fileLength)) ? currentPartialLine : null,
                }
            }
            currentPartialLine += contents
            const lines = currentPartialLine.split(this.capturingLineEnding)
            if(lines.length > 1 && position == 0) {
                return {
                    offset: 0,
                    line: lines[0],
                }
            } else if(
                lines.length > 3 ||
                (
                    lines.length > 1 &&
                    position + currentPartialLine.length >= this.fileLength &&
                    lines[2].length > 0
                )
            ) {
                // This is (part) \n (line) \n (line)
                // or (line) \n (line) \n ""
                // or (part) \n (line) at EOF
                //
                // Note that this is NOT (part) \n "" at EOF
                return {
                    offset: lines[0].length + lines[1].length,
                    line: lines[2],
                }
            }
        } while(currentPartialLine.length < this.maxLineLength)
        throw new Errors.LimitExceeded("Maximum line length exceeded")
    }
}