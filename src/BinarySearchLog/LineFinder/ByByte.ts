import { Base } from "./Base"
import { LineInfo } from "./LineInfo"
export class ByByte extends Base {
    protected async findPosition(lookEarlier: (r: number) => boolean, adjust = 0) {
        const after = await super.findPosition(lookEarlier, adjust)

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

    protected firstLineInfoGivenCeiling(testPosition: number, afterPosition: number) {
        return this.firstLineInfoForwards(testPosition)
    }

    protected lineCeiling(position: number, lineInfo: LineInfo): number {
        return position + 0
    }
}