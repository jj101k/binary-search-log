import assert from "assert"
import {describe, it} from "mocha"
import { Factory } from "../../index"

describe("Extremes", () => {
    const byByteFinder = Factory.getLineFinder("byte")
    const byLineFinder = Factory.getLineFinder("line")
    const binarySearchTester = Factory.getBinarySearchNumberTester("StartingTimestamp")
    describe("Does not fail on empty files", () => {
        const exampleEmptyFile = __dirname + "/../data/empty.log.example"
        it("Does not fail on empty files (by-line)", async () => {
            const file = new byLineFinder(
                new binarySearchTester(null, -1),
                exampleEmptyFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 0, "No lines seen")
        })
        it("Does not fail on empty files (by-byte)", async () => {
            const file = new byByteFinder(
                new binarySearchTester(null, -1),
                exampleEmptyFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 0, "No lines seen")
        })
    })
    describe("Does not fail with no newlines", () => {
        const exampleNoNewlineFile = __dirname + "/../data/range1-1-no-newline.log.example"
        it("Does not fail with no newlines (by-line)", async () => {
            const file = new byLineFinder(
                new binarySearchTester(-1, null),
                exampleNoNewlineFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 1, "All lines seen")
        })
        it("Does not fail with no newlines (by-byte)", async () => {
            const file = new byByteFinder(
                new binarySearchTester(-1, null),
                exampleNoNewlineFile
            )
            let seenLines = 0
            for await(const line of file.readLines()) {
                seenLines++
            }
            file.finish()
            assert.equal(seenLines, 1, "All lines seen")
        })
    })
    it("Does not fail with no ending newline", async () => {
        const exampleNoNewlineFile = __dirname + "/../data/range1-2-no-end-newline.log.example"
        const file = new byLineFinder(
            new binarySearchTester(-1, null),
            exampleNoNewlineFile
        )
        let seenLines = 0
        for await(const line of file.readLines()) {
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 2, "All lines seen")
    })
})