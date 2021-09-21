#!/usr/bin/env node
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
      "help": "h",
      "no-lines": "n",
      "sample-consumer": "s"
    },
    boolean: ["h", "s"],
    default: {
        "f": "DateAutodetect"
    },
    string: ["a", "b", "f"],
})

const filenames = options._
const format = options["format"]
const lowString = options["after-date"]
const highString = options["before-date"]
const noLines = options["no-lines"]
const sampleConsumer = options["sample-consumer"]

const programName = "binary-search-log"

function help() {
    const message = `
Usage: ${programName} [--after-date DATE] [--before-date DATE]
    [--format FORMAT] [--help] [-s] FILENAME...

Finds log file lines between the supplied before and after dates.

    --after-date        -a  Sets the date after which lines will be
                            rejected. Date formats that Javascript can parse
                            are required, and ISO8601 (eg.
                            1999-12-31T23:59:59Z) is probably the easiest.

    --before-date       -b  Sets the date before which lines will be
                            rejected. The format is the same as --after-date
                            above.

    --format            -f  The format of the log line in terms of date
                            discovery. The default is "dateAutodetect", which
                            should work for most cases (by picking one of the
                            others). The handlers are:

                                {{ handlers }}

    --help              -h  This message

    --no-lines          -n  Do not output any lines, just find the edges.
                            This is a good way to test the timing of the
                            search itself, or just whether the lines exist in
                            the file(s).

    --sample-consumer   -s  An example consumer of the line data. This isn't
                            intended for general use, and is instead present
                            as a reference for people who want to use this
                            package's API directly.
    `
    .replace(/^[ ]+/g, "")
    .replace(/[ ]+$/, "\n\n")
    .replace(
        /^([ ]*){{ handlers }}/m,
        (all, $1) => [...Factory.dateHandlerDescriptions.entries()].map(
            ([k, v]) => {
                const prefix = $1 + "    "
                const viewWidth = 80
                const pattern = new RegExp(`(.{${viewWidth - prefix.length - 4},${viewWidth - prefix.length}})[ ]`, "g")
                return `${$1}${k}\n` + prefix + v.replace(pattern, `$1\n${prefix}`)
            }
        ).join("\n")
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