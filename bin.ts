import { EOLPattern, Errors, Factory } from "./index"
import getopts from "getopts"

/**
 *
 * @param dateIn
 * @throws
 * @returns
 */
function dateOrNull(dateIn: string | null | undefined) {
    if(dateIn) {
        const dateOut = new Date(dateIn)
        if(isNaN(dateOut.valueOf())) {
            throw new Errors.Validation(`Date "${dateIn}" is invalid`)
        }
        return dateOut
    } else {
        return null
    }
}

const options = getopts(process.argv.slice(2), {
    alias: {
      "after-date": "a",
      "before-date": "b",
    },
  })

const filenames = options._
const lowString = options["after-date"]
const highString = options["before-date"]

const binarySearchTester = Factory.getBinarySearchDateTester("syslog")
const binarySearchTesterInstance = new binarySearchTester(
    dateOrNull(lowString),
    dateOrNull(highString)
)
const lineFinder = Factory.getLineFinder()

async function findLines() {
    const start = new Date()
    for(const filename of filenames) {
        const finder = new lineFinder(
            binarySearchTesterInstance,
            filename,
            EOLPattern.FoldedLine
        )

        for await (const block of finder.read()) {
            process.stdout.write(block)
        }
        finder.finish()

    }
    const finish = new Date()
    console.log(`Took ${finish.valueOf() - start.valueOf()}ms`)
}

findLines()