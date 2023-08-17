You might ask, "why isn't this trivial?"

Well, if you can put your computer science textbook to one side for a moment,
I'll explain.

There are two fundamental expectations of a basic binary search:

1. It operates on a set of data which can easily be split in two
2. It operates on _unique_ data, or to put it more generally it doesn't have any
   mitigations for non-unique data.

The first of these properties means you can't actually operate on lines unless
they happen to be fixed-length - you have to operate on bytes instead. The
second means that for the actual usage (where you're looking for a specific line
at or after that point) you might end up with an invalid result by landing after
your target line.

Is there already a published algorithm to deal with this? Certainly there must
be, but that's not a reason not to write it.

There's also a notable quirk that typically you don't think about: what if the
target point _isn't there at all_ - what if it would be between two lines?

So here, I'm asking for three states: before, after, and in-range. Those aren't
three states for the binary search - it actually uses (before) and
(in-range | after) only. That's because we actually need to find the
before->in-range edge as the starting point; the "after" value serves to
identify the stopping point and, as an optimisation, help identify if the file
could contain any lines in range.

On the bytes and lines: at each point, we can seek to a _byte_ point. That will
in almost every point be in the middle of a line. To handle that, we always skip
forward to the next newline (currently, taken as `\n` - apologies to legacy Mac
and Windows users). Usually, that's fine - there's little cost to repeatedly
scanning the same line at the end of the process - but if the seek hits exactly
on a line start it might seem like you're throwing away a line. Well, in
practice that's not the case - you can think of it as the program actually
finding the newline between the "before" set and the "after" set. This doesn't
exist for the first line, and while in principle you'd set the bounds as (-1,
length) with the intent to hit on that line, in practice we'd check the first
line anyway and already know if it's a matching point.

Finding the start point:

1. If the file is empty, return immediately
2. Find the last line:
   1. Take `position` to be `length`
   2. Find the last two newlines in the content from `position - chunkSize` to
      `length`.
   3. If not found and `position` is positive, subtract `chunkSize` from
      `position` and go back to 2.
   4. If not found and `position` is nonpositive, take the last line to be the
      entire file.
   4. Take the last line to be the content from after the last newline to
      the end of the file.
3. At offset 0, read one line.
2. If it's *after*, return immediately.
3. If it's *in-range*, take the start point to be 0
4. If it's *before*:
   1. Take `start` to be -1 and `end` to be `file.length`
   2. While `end` is greater than `start + 1`:
      1. Take `position` to be the average of `start` and `end` (rounded)
      2. Find the first newline at or after `position`
      3. Take the current line to be the content after the first newline until
         either a subsequent newline or EOF
      4. If it's *before*, update `start` to match `position`
      5. Otherwise, update `end` to match `position`
5. If it's *before*, return immediately
8. Start output at offset `end`

Output:

1. Read a line.
2. If it's *after*, stop output
3. Send the line, and go back to 1 with the position after the end of the
   current line.

There's an interesting problem in by-byte in relation to line discovery. I've
marked up the following sequence with where the search would look next when
seeking "3", given the subsequent known line from the byte given:

0--1--2--3--4--5--6--7--8-
1  a  \n 2  a  \n 3  b  \n
>  >  >  <  <  <  <  <  <
---------^^^^-------------

This is the worst outcome for a binary search: a wrong decision. To work around
this, when doing a search by byte and not at the start, it will roll forward by
one line. The exception to this is if it's already at byte 0, in which case
adding a line doesn't make sense (here, it happens to be meaningless as the case
of the first line being in range is already optimised).

# From By-Byte to By-Line

The differences between the drivers are:

1. By-byte does not find a line position - it actually finds a byte position
   which will be 1 line too early, so it has to be adjusted at the end
2. By-line does a bunch of work to find lines and deal with them on each
   iteration. This includes:
   1. When looking backwards, the actual start of the rejected line will be used
      as an end point (but not as the binary search ceiling, which will be left as-is)
   2. If a line is not found, it looks in the earlier half to find one. As it
      does so, the rejected start point is retained so that, if eventually
      stepping forward, the correct size range is used.