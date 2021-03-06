#!/usr/bin/env node
import { BinarySearchTester, EOLPattern, Errors, Factory } from "./index"
import getopts from "getopts"
import { SearcherInfoFormatter } from "./src/SearcherInfoFormatter"

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
      "after": "a",
      "before-date": "b",
      "format": "f",
      "help": "h",
      "max-skew": "m",
      "no-lines": "n",
      "sample-consumer": "s",
      "type": "t",
    },
    boolean: ["h", "s"],
    default: {
        "f": "DateAutodetect"
    },
    string: ["a", "b", "f", "m", "t"],
})

const filenames = options._
const format = options["format"]
const lowString = options["after"]
const highString = options["before-date"]
const maxSkew = +(options["max-skew"] || 0)
const noLines = options["no-lines"]
const sampleConsumer = options["sample-consumer"]
const type = options["type"] || "date"

const programName = "binary-search-log"

function help() {
    const message = `
Usage: ${programName} [--type date] [--after EXPRESSION] [--before EXPRESSION]
    [--format FORMAT] [--max-skew NUMBER] [--help] [-s] FILENAME...

Finds log file lines between the supplied before and after dates.

    --after             -a  Sets the value after which lines will be
                            rejected. See also --type.

    --before            -b  Sets the value before which lines will be
                            rejected.  See also --type.

    --format            -f  The format of the log line in terms of value
                            discovery. This depends on the option used for
                            --type.

                            Date: The default is "dateAutodetect", which
                            should work for most cases (by picking one of the
                            others). The handlers are:

                                {{ dateHandlers }}

                            Number: The default is "startingNumber". The
                            handlers are:

                                {{ numberHandlers }}

    --help              -h  This message

    --no-lines          -n  Do not output any lines, just find the edges.
                            This is a good way to test the timing of the
                            search itself, or just whether the lines exist in
                            the file(s).

    --max-skew          -m  Where the lines are a little disordered, the
                            maximum number of places you expect anything to
                            be skewed by. For dates, this is a number of
                            seconds. This defaults to 0.

    --sample-consumer   -s  An example consumer of the line data. This isn't
                            intended for general use, and is instead present
                            as a reference for people who want to use this
                            package's API directly.

    --type              -t  The type, one of:

                                date
                                    Date formats that Javascript can parse
                                    are required for --after and --before,
                                    and ISO8601 (eg. 1999-12-31T23:59:59Z)
                                    is probably the easiest.
                                number
                                    A Javascript-parseable number is
                                    required for --after and --before

                            This defaults to date
    `
    .replace(/^[ ]+/g, "")
    .replace(/[ ]+$/, "\n\n")
    .replace(
        /^([ ]*){{ dateHandlers }}/m,
        (all, $1) => {
            const formatter = new SearcherInfoFormatter($1)
            return [...Factory.dateHandlerDescriptions.entries()].map(
                ([name, description]) => formatter.format(name, description)
            ).join("\n")
        }
    )
    .replace(
        /^([ ]*){{ numberHandlers }}/m,
        (all, $1) => {
            const formatter = new SearcherInfoFormatter($1)
            return [...Factory.numberHandlerDescriptions.entries()].map(
                ([name, description]) => formatter.format(name, description)
            ).join("\n")
        }
    )
    process.stdout.write(message)
}

if(options["help"]) {
    help()
    process.exit(0)
} else if(!filenames.length) {
    help()
    process.exit(1)
}

let binarySearchTesterInstance: BinarySearchTester.Base<any>
if(type == "date") {
    const binarySearchTester = Factory.getBinarySearchDateTester(format)
    binarySearchTesterInstance = new binarySearchTester(
        dateOrNull(lowString),
        dateOrNull(highString)
    )
} else if(type == "number") {
    const binarySearchTester = Factory.getBinarySearchNumberTester(format)
    binarySearchTesterInstance = new binarySearchTester(
        +lowString,
        +highString
    )
} else {
    throw new Error(`Unhandled type: ${type}`)
}
const lineFinder = Factory.getLineFinder()

async function findLines() {
    const start = new Date()
    for(const filename of filenames) {
        const finder = new lineFinder(
            binarySearchTesterInstance,
            filename,
            EOLPattern.FoldedLine,
            undefined,
            maxSkew
        )

        if(noLines) {
            const positions = await finder.findEdges()
            if(!positions) {
                process.stdout.write(`${filename}: no match\n`)
            } else {
                const [from, to] = positions
                process.stdout.write(`${filename}: matches in range ${from} to ${to}\n`)
            }
        } else if(sampleConsumer) {
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