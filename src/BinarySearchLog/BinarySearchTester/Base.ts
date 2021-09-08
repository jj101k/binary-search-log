export abstract class Base<T> {
    abstract linePattern: RegExp

    /**
     *
     * @param lowBound
     * @param highBound
     */
    constructor(protected lowBound: T | null, protected highBound: T | null) {
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