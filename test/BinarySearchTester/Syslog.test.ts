import assert from "assert"
import * as fs from "fs"
import {describe, it} from "mocha"
import { Factory } from "../../index"

describe("Date searcher tests (syslog)", () => {
    const lineFinder = Factory.getLineFinder("line")
    const binarySearchTester = Factory.getBinarySearchDateTester("Syslog")
    const example1To100LogFile = __dirname + "/../data/range1-100.syslog.example"
    const tooLowDate = new Date(1999, 11, 31)
    const referenceDate = new Date(2000, 0, 1)
    const tooHighDate = new Date(2038, 0, 1)
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
    describe("Can find every line in a random-line-length file", function() {
        this.slow(500) // these have a lot of work to do

        let fileHandle: number
        before(() => fileHandle = fs.openSync(example1To100LogFile, "r"))
        after(() => fs.closeSync(fileHandle))
        const byteLineFinder = Factory.getLineFinder("byte")
        it("Can find every line in a random-line-length file (by-byte)", async () => {
            for(let i = 0; i < 100; i++) {
                const targetDate = new Date(referenceDate.valueOf())
                targetDate.setHours(i)
                const file = new byteLineFinder(
                    new binarySearchTester(targetDate, targetDate, referenceDate),
                    example1To100LogFile,
                    undefined,
                    fileHandle
                )
                let seenLines = 0
                for await(const line of file.readLines()) {
                    seenLines++
                    const parts = line.split(/ +/, 3)
                    assert.equal(parts[1], 1 + Math.floor(i / 24))
                    assert.equal(+parts[2].replace(/:.*/, ""), i % 24)
                }
                file.finish()
                assert.equal(seenLines, 1, `Exactly one line seen (${i}) (${targetDate})`)
            }
        })
        it("Can find every line in a random-line-length file (by-line)", async () => {
            for(let i = 0; i < 100; i++) {
                const targetDate = new Date(referenceDate.valueOf())
                targetDate.setHours(i)
                const file = new lineFinder(
                    new binarySearchTester(targetDate, targetDate, referenceDate),
                    example1To100LogFile,
                    undefined,
                    fileHandle
                )
                let seenLines = 0
                for await(const line of file.readLines()) {
                    seenLines++
                    const parts = line.split(/ +/, 3)
                    assert.equal(parts[1], 1 + Math.floor(i / 24))
                    assert.equal(+parts[2].replace(/:.*/, ""), i % 24)
                }
                file.finish()
                assert.equal(seenLines, 1, `Exactly one line seen (${i}) (${targetDate})`)
            }
        })
    })
})