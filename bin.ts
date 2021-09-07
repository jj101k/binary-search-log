import { EOLPattern, Factory } from "./index"
import getopts from "getopts"

const options = getopts(process.argv.slice(2), {
  alias: {
    "after-date": "a",
    "before-date": "b",
  },
})

const filenames = options._
const lowString = options["after-date"]
const highString = options["before-date"]

const low = new Date(lowString)
if(isNaN(low.valueOf())) {
    throw new Error(`Date "${lowString}" is invalid`)
}
const high = new Date(highString)
if(isNaN(high.valueOf())) {
    throw new Error(`Date "${highString}" is invalid`)
}
const dateSearcher = Factory.getDateSearcher("syslog")
const dateSearcherInstance = new dateSearcher(low, high)
const lineFinder = Factory.getLineFinder()

async function findLines() {
    const start = new Date()
    for(const filename of filenames) {
        const finder = new lineFinder(
            dateSearcherInstance,
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