import { EOLPattern, Filename, DateSearcher, LineDatePattern } from "./index"

const [filename, lowString, highString] = process.argv.slice(2)

const low = new Date(lowString)
if(isNaN(low.valueOf())) {
    throw new Error(`Date "${lowString}" is invalid`)
}
const high = new Date(highString)
if(isNaN(high.valueOf())) {
    throw new Error(`Date "${highString}" is invalid`)
}
const dateSearcher = new DateSearcher(
    LineDatePattern.Syslog,
    (dateIn) => dateIn + " " + low.getFullYear()
)
const file = new Filename(
    dateSearcher.lineHandler(low, high),
    filename,
    EOLPattern.FoldedLine
)
const getLines = async () => {
    for await (const line of file.read()) {
        process.stdout.write(line)
    }
    file.finish()
}

getLines()