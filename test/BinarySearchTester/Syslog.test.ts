import assert from "assert"
import {describe, it} from "mocha"
import { Factory } from "../../index"

describe("Date searcher tests (syslog)", () => {
    const lineFinder = Factory.getLineFinder("line")
    const binarySearchTester = Factory.getBinarySearchDateTester("syslog")
    const example1To100LogFile = __dirname + "/../data/range1-100.syslog.example"
    const tooLowDate = new Date("1999-12-31")
    const referenceDate = new Date("2000-01-01")
    const tooHighDate = new Date("2038-01-01")
    describe("Finish-only", () => {
        it("Can skip out-of-range files (finish)", async () => {
            const file = new lineFinder(
                new binarySearchTester(null, tooLowDate, referenceDate),
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
                new binarySearchTester(null, tooHighDate, referenceDate),
                example1To100LogFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 100, "Matching lines seen")
        })
    })
    describe("Start-only", () => {
        it("Can skip out-of-range files (start)", async () => {
            const file = new lineFinder(
                new binarySearchTester(tooHighDate, null, referenceDate),
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
                new binarySearchTester(tooLowDate, null, referenceDate),
                example1To100LogFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 100, "Matching lines seen")
        })
    })
})