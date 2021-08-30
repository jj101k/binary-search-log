import { Filename } from "./index"

const file = new Filename(
    line => line.match(/process[.]/) ? 1 : 0,
    process.argv[2]
)
const getLines = async () => {
    for await (const line of file.read()) {
        process.stdout.write(line)
    }
    file.finish()
}

getLines()