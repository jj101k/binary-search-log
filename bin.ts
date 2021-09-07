import { EOLPattern, Factory } from "./index"
import getopts from "getopts"

const options = getopts(process.argv.slice(2), {
  alias: {
    "after-date": "a",
    "before-date": "b",
  },
})

const filename = options._[0]
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

const file = new lineFinder(
    dateSearcherInstance,
    filename,
    EOLPattern.FoldedLine
)
const getLines = async () => {
    for await (const block of file.read()) {
        process.stdout.write(block)
    }
    file.finish()
}

const start = new Date()

getLines().then(() => {
    const finish = new Date()
    console.log(`Took ${finish.valueOf() - start.valueOf()}ms`)
})