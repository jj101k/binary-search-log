import assert from "assert"
import {describe, it} from "mocha"

import { Filename } from "../index"

describe("File tests", () => {
    const example1To100LogFile = __dirname + "/data/range1-100.log.example"
    it("Can skip out-of-range files", async () => {
        const file = new Filename(
            line => {
                const n = +(line.split(/ /)[0])
                if(n < 1000) return -1
                else if(n > 3000) return 1
                else return 0
            },
            example1To100LogFile
        )
        let seenLines = 0
        for await(const line of file.read()) {
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 0, "No lines seen")
    })
    it("Can read in-range files (start)", async () => {
        const file = new Filename(
            line => {
                const n = +(line.split(/ /)[0])
                if(n < -10) return -1
                else if(n > 30) return 1
                else return 0
            },
            example1To100LogFile
        )
        let seenLines = 0
        for await(const line of file.read()) {
            assert.match(line, /^(?:[1-2]?[0-9]|30) /, `Line ${line} is in range`)
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 30, "Matching lines seen")
    })
    it("Can read in-range files (finish)", async () => {
        const file = new Filename(
            line => {
                const n = +(line.split(/ /)[0])
                if(n < 60) return -1
                else if(n > 110) return 1
                else return 0
            },
            example1To100LogFile
        )
        let seenLines = 0
        for await(const line of file.read()) {
            assert.match(line, /^(?:[6-9]?[0-9]|100) /, `Line ${line} is in range`)
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 41, "Matching lines seen")
    })
    it("Can read in-range files (middle)", async () => {
        const file = new Filename(
            line => {
                const n = +(line.split(/ /)[0])
                if(n < 10) return -1
                else if(n > 20) return 1
                else return 0
            },
            example1To100LogFile
        )
        let seenLines = 0
        for await(const line of file.read()) {
            assert.match(line, /^(?:1[0-9]|20) /, `Line ${line} is in range`)
            seenLines++
        }
        file.finish()
        assert.equal(seenLines, 11, "Matching lines seen")
    })
})