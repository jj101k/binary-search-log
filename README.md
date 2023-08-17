# binary-search-log
A binary searcher for plain-text timestamped logs

The point here is to get to the start line for a search ASAP. Normally, if
you're doing a `grep <timestamp> <logfile>` and it's a big file, you have to
wait a while - equivalently, if you do `less <logfile>` then
forward-search for `<timestamp>` you'll have similar problems.

If you're already using a logging database like **journald** for all your
logging, congratulations! That's another (more general) way of doing the same
thing, and in that case you don't need this utility: just read up on the
arguments for your logging database and you'll be fine.

Forward-search in a log file, as in any text file is O(n) - so if it's a 2GB
file, your order of magnitude is 2 billion, and disc access is slow so you're
going to feel it. Binary search is O(log n), so if it's a 2GB file your order of
magnitude is 31 (or 9). It's a LOT faster.

## Limitations

This relies on the lines being in order, which usually means timestamped on
entry.

This also relies on having normal seek() behaviour. If your source does not
support seek() at all (eg. .gz data) or emulates seek() via straight-line read,
you can expect that you'd have the same performance as a straight search.

## Quick Start (Command-line)

If you're just using the command-line utility, you can do something like:

```sh
binary-search-log --after 2021-09-01T00:00:00 --before 2021-09-09T05:20:00 \
    --format DateAutodetect /var/log/system.log | less
```

This does support --help, so you can check for more options that way.

## Quick Start (Code)

```js
import {Factory} from "binary-search-log"
const binarySearchTester = Factory.getBinarySearchDateTester("DateAutodetect")
const lineFinder = Factory.getLineFinder()

const finder = new lineFinder(
    new binarySearchTester(low, high),
    filename
)
for await (const line of finder.readLines()) {
    process.stdout.write(line)
}
finder.finish()
```

## Bugs and Edge Cases

### What if the file contains no newlines or is just garbage?

The search will work without newlines (it will be taken as a single line). If
you have random content, you can expect to get a parse failure exception.

### What if each line is extremely long?

If it's over 1MiB, you'll get an exception. Anything below that should work
fine.

### What if it's not completely ordered?

In some cases with source-supplied timestamps and multiple writers, you might
have a timestamp which deviates from the insertion time, either because it
refers to some non-contemporary value (eg. HTTP request start time) or is
buffered before insertion.

Where that's the case, this may end up selecting the wrong start or end points,
but even the *right* start and end points might not contain the line(s) you're
seeking. Where that's the case, you should set the _max skew_ to the maximum
offset line keys would have from the appropriate one for the file position, and
the tool will look earlier/finish later and individually check the lines. Keep
in mind though that this is less efficient - O(n) for the skew distance rather
than O(log n).

### What about super-long lines?

Line which exceeds the block size (currently 64KiB) aren't supported.

## Supported File Formats

At the time of writing, this supports:

1. *Syslog*: syslog (or at least, some versions of it). Keep in mind that if you have
   `journalctl`, that will probably work better for you.
2. *CommonLogFormat*: CLF (Common Log Format) access logs, as you'd get from Apache HTTPd
3. *UniversalSortableLog*: Logs in Universal Sortable format, which start with
   dates like "1999-12-31 23:59:59Z".

If you have a file in an unknown but supported date format, you can use
*DateAutodetect* or, if it's in a variety of supported date formats,
*DateAutodetectPerLine*.

## Non-Date Formats

This has less-than-complete support for non-date formats if you happen to have
one of those and it is, again, strictly ordered. However, because the _types_ of
the constructor arguments are different there, it isn't built through the same
interface. Using that is like:

```js
import {Factory} from "binary-search-log"
const binarySearchTester = Factory.getBinarySearchNumberTester("StartingNumber")
const lineFinder = Factory.getLineFinder()

const finder = new lineFinder(
    new binarySearchTester(low, high),
    filename
)
for await (const line of finder.readLines()) {
    process.stdout.write(line)
}
finder.finish()
```

At the time of writing, the only such type that's supported is UNIX-like timestamps.

## FUTURE

* Add basic support for embedded `<ol>` in HTML files (header/footer garbage etc)

## That Mitigation

So, the problem file looks like: abcdfghEijk. This creates two problems when
looking for a point between X (where the line belongs) and X' (where it is): (1)
if you hit a misplaced line, you'll end up looking too late in the file; and (2)
if you're looking for that misplaced line otherwise, you'll end up too early in
the file.

If the first were the only problem, some basic statistical examination of nearby
rows would do the job - but to hit the second, you need _fuzz_. For scenario 1,
you need to start _fuzz_ distance early; and for scenario 2 you need to end
_fuzz_ distance late. Since the matter of whether the line is displaced won't be
known in advance, fuzz in both directions are needed - and that means that means
that all lines in the fuzz range must be examined individually (ie, between
before - fuzz and before, and between after and after + fuzz). On the early side
that's completely simple: you check until you reach one that reports the
beginning timestamp. On the late side it's a bit more complicated: there has to
be a _suspicious range_, and if the _after_ line is displaced that range should
start a little earlier, so the actual targets are before-fuzz, after-fuzz,
after+fuzz.

It would be perfectly possible to note out-of-range values where they are found,
but since only log(n) values will be examined, this will usually not be useful.