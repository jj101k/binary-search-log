import assert from "assert"
import {describe, it} from "mocha"
import { Factory } from "../../index"

describe("Extremes", () => {
    const lineFinder = Factory.getLineFinder("line")
    const binarySearchTester = Factory.getBinarySearchNumberTester("startingTimestamp")
    it("Does not fail with no ending newline", async () => {
        const exampleNoNewlineFile = __dirname + "/../data/range1-2-no-end-newline.log.example"
        const file = new lineFinder(
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