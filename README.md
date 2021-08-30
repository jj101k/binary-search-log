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
entry. If they're timestamped at some other point - and traditional Apache
access logs are like that - you'll get inconsistent results. In general for
these cases you will want to search for a point that's a bit earlier. Future
versions of this tool might mitigate this by gathering multiple entries.

This fundamentally relies on having normal seek() behaviour. If your source does
not support seek() at all (eg. .gz data) or emulates seek() via straight-line
read, you can expect that you'd have the same performance as a straight search.