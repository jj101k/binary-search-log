import { EOLPattern, DateSearcher, Factory } from "./index"

const [filename, lowString, highString] = process.argv.slice(2)

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