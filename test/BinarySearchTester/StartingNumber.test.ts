import assert from "assert"
import {describe, it} from "mocha"
import { Factory } from "../../index"

describe("Date searcher tests (starting number)", () => {
    const lineFinder = Factory.getLineFinder("line")
    const binarySearchTester = Factory.getBinarySearchNumberTester("StartingTimestamp")
    const example1To100LogFile = __dirname + "/../data/range1-100.log.example"
    describe("Finish-only", () => {
        it("Can skip out-of-range files (finish)", async () => {
            const file = new lineFinder(
                new binarySearchTester(null, -1),
                example1To100LogFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 0, "No lines seen")
        })
        it("Can read in-range files (finish)", async () => {
            const file = new lineFinder(
                new binarySearchTester(null, 110),
                example1To100LogFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                assert.match(line, /^(?:[1-9]?[0-9]|100) /, `Line ${line} is in range`)
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 100, "Matching lines seen")
        })
    })
    describe("Start-only", () => {
        it("Can skip out-of-range files (start)", async () => {
            const file = new lineFinder(
                new binarySearchTester(1000, null),
                example1To100LogFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 0, "No lines seen")
        })
        it("Can read in-range files (start)", async () => {
            const file = new lineFinder(
                new binarySearchTester(-10, null),
                example1To100LogFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                assert.match(line, /^(?:[1-9]?[0-9]|100) /, `Line ${line} is in range`)
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 100, "Matching lines seen")
        })
    })
})