import assert from "assert"
import {before, describe, it} from "mocha"
import { Factory } from "../../index"
import { TestHelper } from "../src/TestHelper"
import * as TestLogFileData from "../src/TestLogFileData"

describe("File-by-byte tests", () => {
    const lineFinder = Factory.getLineFinder("byte")
    const binarySearchTester = Factory.getBinarySearchNumberTester("StartingNumber")
    const example1To100LogFile = __dirname + "/../data/range1-100.log.example"

    const testHelper = new TestHelper(lineFinder, binarySearchTester, example1To100LogFile)

    const topEdge = 100
    const bottomEdge = 1
    testHelper.testLinesSeen("Can skip out-of-range files", topEdge + 10, topEdge + 20, 0)
    for(const bottomOffset of [-1, 0, 1]) {
        for(const topOffset of [-1, 0, 1]) {
            testHelper.testLinesSeen(
                "Can read in-range files",
                bottomEdge + bottomOffset,
                topEdge + topOffset,
                topEdge + Math.min(topOffset, 0) - bottomEdge - Math.max(bottomOffset, 0) + 1
            )
        }
    }

    for(const bottomOffset of [0, 1]) {
        testHelper.testLinesSeen(
            "Can read edge files",
            bottomEdge - 1,
            bottomEdge + bottomOffset,
            bottomOffset + 1
        )
    }

    for(const topOffset of [-1, 0]) {
        testHelper.testLinesSeen(
            "Can read edge files",
            topEdge + topOffset,
            topEdge + 1,
            1 - topOffset
        )
    }

    describe("large file tests", () => {
        const largeLogFileLines = 2_000_000
        const logFileData = new TestLogFileData.Number(largeLogFileLines)
        before(() => logFileData.build())
        after(() => logFileData.finish())
        it("Can read in-range files (middle, large)", async function() {
            this.timeout(20)
            const file = new lineFinder(
                new binarySearchTester(
                    largeLogFileLines / 2 + 10,
                    largeLogFileLines / 2 + 20,
                ),
                logFileData.filename!
            )
            let seenLines = 0
            const start = new Date()
            for await(const line of file.readLines()) {
                const n = +line.replace(/ .*/, "")
                assert(n >= largeLogFileLines / 2 + 10 && n <= largeLogFileLines / 2 + 20)
                seenLines++
            }
            file.finish()
            const finish = new Date()
            assert.equal(seenLines, 11, "Matching lines seen")
            console.log(`Searched ${logFileData.filename!} in ${finish.valueOf() - start.valueOf()}ms`)
        })
    })
})