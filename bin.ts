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
      "format": "f",
      "sample-consumer": "s"
    },
})

const filenames = options._
const format = options["format"] || "dateAutodetect"
const lowString = options["after-date"]
const highString = options["before-date"]
const sampleConsumer = options["sample-consumer"]

const binarySearchTester = Factory.getBinarySearchDateTester(format)
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

        if(sampleConsumer) {
            let l = 0
            const prefixes = new Map<string, number>()
            const highest = {count: 0, prefix: ""}
            for await (const line of finder.readLines()) {
                const prefix = line.replace(/^(.{10}).*/s, "$1...")
                const newCount = (prefixes.get(prefix) ?? 0) + 1
                prefixes.set(prefix, newCount)
                if(newCount > highest.count) {
                    highest.count = newCount
                    highest.prefix = prefix
                }
                l++
                const highestPercent = ("" + Math.round(100 * highest.count / l)).padStart(3, " ")
                process.stderr.write(
                    `${l} lines - most frequent prefix is "${highest.prefix}" at ${highestPercent}%\r`
                )
            }
            process.stderr.write("\n")
        } else {
            for await (const block of finder.read()) {
                process.stdout.write(block)
            }
        }
        finder.finish()

    }
    const finish = new Date()
    console.log(`Took ${finish.valueOf() - start.valueOf()}ms`)
}

findLines()