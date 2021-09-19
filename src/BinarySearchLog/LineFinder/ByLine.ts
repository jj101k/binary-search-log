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
}