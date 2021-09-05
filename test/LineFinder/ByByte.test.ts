import assert from "assert"
import {before, describe, it} from "mocha"
import { Factory } from "../../index"
import { TestLogFileData } from "../src/TestLogFileData"

describe("File-by-byte tests", () => {
    const lineFinder = Factory.getLineFinder("byte")
    const dateSearcher = Factory.getDateSearcher("startingTimestamp")
    const example1To100LogFile = __dirname + "/../data/range1-100.log.example"
    it("Can skip out-of-range files", async () => {
        const file = new lineFinder(
            new dateSearcher(new Date(1000), new Date(3000)),
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
            new dateSearcher(new Date(-10), new Date(30)),
            example1To100LogFile
        )
        let seenLines = 0
        for await(const line of file.readLines()) {
            assert.match(line, /^(?:[1-2]?[0-9]|30) /, `Line ${line} is in range`)
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 30, "Matching lines seen")
    })
    it("Can read in-range files (finish)", async () => {
        const file = new lineFinder(
            new dateSearcher(new Date(60), new Date(110)),
            example1To100LogFile
        )
        let seenLines = 0
        for await(const line of file.readLines()) {
            assert.match(line, /^(?:[6-9]?[0-9]|100) /, `Line ${line} is in range`)
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 41, "Matching lines seen")
    })
    it("Can read in-range files (middle)", async () => {
        const file = new lineFinder(
            new dateSearcher(new Date(10), new Date(20)),
            example1To100LogFile
        )
        let seenLines = 0
        for await(const line of file.readLines()) {
            assert.match(line, /^(?:1[0-9]|20) /, `Line ${line} is in range`)
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 11, "Matching lines seen")
    })

    // You can remove .skip below if you want to try this.
    describe.skip("large file tests", () => {
        const largeLogFileLines = 2_000_000
        const logFileData = new TestLogFileData(largeLogFileLines)
        before(() => logFileData.build())
        after(() => logFileData.finish())
        it("Can read in-range files (middle, large)", async function() {
            this.timeout(20)
            const file = new lineFinder(
                new dateSearcher(
                    new Date(largeLogFileLines / 2 + 10),
                    new Date(largeLogFileLines / 2 + 20)
                ),
                logFileData.filename!
            )
            let seenLines = 0
            const start = new Date()
            for await(const line of file.readLines()) {
                const timestamp = +line.replace(/ .*/, "")
                assert(timestamp >= largeLogFileLines / 2 + 10 && timestamp <= largeLogFileLines / 2 + 20)
                seenLines++
            }
            file.finish()
            const finish = new Date()
            assert.equal(seenLines, 11, "Matching lines seen")
            console.log(`Searched ${logFileData.filename!} in ${finish.valueOf() - start.valueOf()}ms`)
        })
    })
})