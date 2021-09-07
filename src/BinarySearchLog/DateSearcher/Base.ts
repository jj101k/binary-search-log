export abstract class Base {
    abstract linePattern: RegExp

    /**
     *
     */
    protected referenceDate: Date

    /**
     *
     * @param lowBound
     * @param highBound
     * @param referenceDate
     */
    constructor(protected lowBound: Date | null, protected highBound: Date | null, referenceDate?: Date) {
        const bestReferenceDate = referenceDate ?? lowBound ?? highBound
        if(bestReferenceDate) {
            this.referenceDate = bestReferenceDate
        } else {
            throw new Error(`Cannot start a date searcher without a reference date`)
        }
    }

    /**
     * This must return -1 for lines before the intended range,
     * 1 for lines after the intended range, and 0 for lines in range
     *
     * @param line
     * @throws
     * @returns
     */
    abstract getRelativeLinePosition(line: string): number
}