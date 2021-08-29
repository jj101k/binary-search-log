import { Filename } from "./src/BinarySearchLog"

const file = new Filename(
    line => line.match(/process[.]/) ? 1 : 0,
    process.argv[2]
)
file.read()