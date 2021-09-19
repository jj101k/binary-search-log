import { Base } from "./Base"
import { LineInfo } from "./LineInfo"
export class ByLine extends Base {
    protected adjustedPosition(position: number, lineInfo: LineInfo): number {
        return position + lineInfo.offset
    }

    protected firstLineInfoGivenCeiling(testPosition: number, afterPosition: number) {
        return this.firstLineInfoForwards(testPosition, afterPosition + 1)
    }
}