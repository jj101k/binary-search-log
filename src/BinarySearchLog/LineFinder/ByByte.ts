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
        let testPosition: number
        do {
            testPosition = Math.round((before + after) / 2)
            const {line: line} = await this.firstLineInfoForwards(testPosition)
            const state = this.binarySearchTester.getRelativeLinePosition(line)
            if(lookEarlier(state)) {
                after = testPosition
            } else {
                before = testPosition
            }
        } while(after > before + 1)

        /*
         * @todo this should really filter to the line offsets and instead abort
         * once there is only one line boundary left
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
                    line: (offset == this.fileLength - 1 || offset == this.fileLength) ? currentPartialLine : "",
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