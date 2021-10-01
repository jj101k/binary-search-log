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
     * @param adjust Meaning depends on context, but this is how far the line's
     * value will be adjusted before comparison. Can be negative.
     * @throws
     * @returns
     */
    abstract getRelativeLinePosition(line: string, adjust?: number): number
}