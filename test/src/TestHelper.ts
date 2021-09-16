import assert from "assert"
import { BinarySearchTester } from "../../src/BinarySearchLog"
import { ByByte, ByLine } from "../../src/BinarySearchLog/LineFinder"

type nonAbstractBinarySearchTester<T> = {
    new(l: T | null, h: T | null, r?: T): BinarySearchTester.Base<T>
}

export class TestHelper {
    /**
     *
     * @param lineFinder
     * @param binarySearchTester
     * @param logFile
     */
    constructor(
        private lineFinder: typeof ByByte | typeof ByLine,
        private binarySearchTester: nonAbstractBinarySearchTester<any>,
        private logFile: string
    ) {

    }
    /**
     *
     * @param label
     * @param bottomPosition
     * @param topPosition
     * @param expectedLines
     */
    testLinesSeen(label: string, bottomPosition: number, topPosition: number, expectedLines: number) {
        it(`${label} (${bottomPosition} to ${topPosition})`, async () => {
            const file = new this.lineFinder(
                new this.binarySearchTester(bottomPosition, topPosition),
                this.logFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                const parts = line.split(/ /)
                const n = +parts[0]
                assert(
                    n <= topPosition && n >= bottomPosition,
                    `Line ${line} is between ${topPosition} and ${bottomPosition}`
                )
                seenLines++
            }
            file.finish()
            assert.equal(expectedLines, seenLines, `${expectedLines} Matching lines seen`)
        })
    }
}