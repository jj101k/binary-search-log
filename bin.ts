import { File } from "./src/BinarySearchLog"

const file = new File(
    line => line.match(/process[.]/) ? 1 : 0,
    process.argv[2]
)
file.read()