import { Base } from "./Base"
import { LineInfo } from "./LineInfo"
export class ByByte extends Base {
    protected async findPosition(lookEarlier: (r: number) => boolean, adjust: number) {
        const after = await super.findPosition(lookEarlier, adjust)

        /*
         * This reads forward one line on finish, because the quirks
         * of looking for the first COMPLETE line mean that this will
         * always produce a result which is one line early.
         *
         * Except when it's the first position in the file, or otherwise after
         * the last newline, in which case the original position is retained.
         */
        const position = after
        if(position != 0) {
            const contents = await this.readString(position)
            const lines = contents.split(this.capturingLineEnding, 2)
            if(lines.length > 1) {
                return position + lines[0].length + lines[1].length
            }
        }
        return position
    }

    protected firstLineInfoGivenCeiling(testPosition: number, afterPosition: number) {
        return this.firstLineInfoForwards(testPosition)
    }

    protected lineCeiling(position: number, lineInfo: LineInfo): number {
        return position + 0
    }
}