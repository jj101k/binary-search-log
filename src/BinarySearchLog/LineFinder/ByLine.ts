import * as Errors from "../Errors"
import { Base } from "./Base"
export class ByLine extends Base {
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
            const lineInfo = await this.firstLineInfoForwards(testPosition, after + 1)
            if(lineInfo.line === null) {
                if(before + 1 == testPosition) {
                    // No detected line, no further revision possible
                    break
                } else {
                    // No detected line, look earlier but keep after position
                    testPosition = Math.round((before + testPosition) / 2)
                }
            } else {
                testPosition += lineInfo.offset
                const state = this.binarySearchTester.getRelativeLinePosition(lineInfo.line)
                if(lookEarlier(state)) {
                    after = testPosition
                } else {
                    before = testPosition
                }
                testPosition = Math.round((before + after) / 2)
            }
        } while(after > before + 1)

        return after
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
                    line: (offset == this.fileLength - 1) ? currentPartialLine : null,
                }
            }
            currentPartialLine += contents
            const lines = currentPartialLine.split(this.capturingLineEnding)
            if(lines.length > 1 && position == 0) {
                return {
                    offset: 0,
                    line: lines[0],
                }
            } else if(lines.length > 3) {
                return {
                    offset: lines[0].length + lines[1].length,
                    line: lines[2],
                }
            }
        } while(currentPartialLine.length < this.maxLineLength)
        throw new Errors.LimitExceeded("Maximum line length exceeded")
    }
}