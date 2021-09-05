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
    constructor(protected lowBound: Date, protected highBound: Date, referenceDate?: Date) {
        this.referenceDate = referenceDate ?? lowBound
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