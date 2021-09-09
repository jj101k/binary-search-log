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
      "sample-consumer": "s"
    },
    boolean: ["h", "s"],
    default: {
        "f": "dateAutodetect"
    },
    string: ["a", "b", "f"],
})

const filenames = options._
const format = options["format"]
const lowString = options["after-date"]
const highString = options["before-date"]
const sampleConsumer = options["sample-consumer"]

function help() {
    process.stderr.write(`
Usage: ${process.argv[1]} [--after-date DATE] [--before-date DATE]
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

                                commonLogFormat
                                    Access logs in CLF format
                                dateAutodetect
                                    Detect which other handler to use
                                dateAutodetectPerLine
                                    As dateAutodetect, but does its thing on
                                    every line. Use if you have a mix of
                                    different line formats in there.
                                syslog
                                    Normal syslog format, eg. /var/log/messages
                                universalSortableLog
                                    Lines starting with a date like
                                    "1999-12-31 23:59:59"

    --help              -h  This message

    --sample-consumer   -s  An example consumer of the line data. This isn't
                            intended for general use, and is instead present
                            as a reference for people who want to use this
                            package's API directly.
    `.replace(/^\s+/g, "").replace(/\s+$/, "\n\n"))
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