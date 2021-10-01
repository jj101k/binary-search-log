import assert from "assert"
import {describe, it} from "mocha"
import { Factory } from "../../index"
import * as fs from "fs"

describe("Date searcher tests (starting number)", () => {
    const lineFinder = Factory.getLineFinder("line")
    const binarySearchTester = Factory.getBinarySearchNumberTester("StartingNumber")
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
    describe("Can find every line in a disordered file", function() {
        this.slow(500) // these have a lot of work to do
        const example1To100DisorderedLogFile = __dirname + "/../data/range1-100-disordered.log.example"

        const maxSkew = 30
        let fileHandle: number
        before(() => fileHandle = fs.openSync(example1To100DisorderedLogFile, "r"))
        after(() => fs.closeSync(fileHandle))
        const byteLineFinder = Factory.getLineFinder("byte")
        it("Works by-byte", async () => {
            for(let i = 1; i <= 100; i++) {
                const file = new byteLineFinder(
                    new binarySearchTester(i, i),
                    example1To100DisorderedLogFile,
                    undefined,
                    fileHandle,
                    maxSkew,
                )
                let seenLines = 0
                for await(const line of file.readLines()) {
                    seenLines++
                    const parts = line.split(/ +/, 3)
                    assert.equal(parts[0], i)
                }
                file.finish()
                assert.equal(seenLines, 1, `Exactly one line seen (${i})`)
            }
        })
        it("Works by-line", async () => {
            for(let i = 1; i <= 100; i++) {
                const file = new lineFinder(
                    new binarySearchTester(i, i),
                    example1To100DisorderedLogFile,
                    undefined,
                    fileHandle,
                    maxSkew,
                )
                let seenLines = 0
                for await(const line of file.readLines()) {
                    seenLines++
                    const parts = line.split(/ +/, 3)
                    assert.equal(parts[0], i)
                }
                file.finish()
                assert.equal(seenLines, 1, `Exactly one line seen (${i})`)
            }
        })
    })
    describe("Can find one line in a presumed-disordered file", function() {
        const example1To100LogFile = __dirname + "/../data/range1-100.log.example"

        const maxSkew = 3
        const byteLineFinder = Factory.getLineFinder("byte")
        const lowPoint = 50
        const highPoint = 59
        it("Works by-byte", async () => {
            const file = new byteLineFinder(
                new binarySearchTester(lowPoint, highPoint),
                example1To100LogFile,
                undefined,
                undefined,
                maxSkew,
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
                const parts = line.split(/ +/, 3)
                assert(+parts[0] >= lowPoint && +parts[0] <= highPoint)
            }
            file.finish()
            assert.equal(seenLines, 10, `Exactly ten lines seen`)
        })
        it("Works by-line", async () => {
            const file = new lineFinder(
                new binarySearchTester(lowPoint, 59),
                example1To100LogFile,
                undefined,
                undefined,
                maxSkew,
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
                const parts = line.split(/ +/, 3)
                assert(+parts[0] >= lowPoint && +parts[0] <= highPoint)
            }
            file.finish()
            assert.equal(seenLines, 10, `Exactly ten lines seen`)
        })
    })
})