import { EOLPattern, Filename, DateSearcher, LineDatePattern } from "./index"

const [filename, lowString, highString] = process.argv.slice(2)

const low = new Date(lowString)
const high = new Date(highString)
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