export class DateSearcher {
    /**
     *
     * @param linePattern
     * @param sanitise
     */
    constructor(public linePattern: RegExp, private sanitise: (dateString: string) => string) {

    }
    /**
     *
     * @param low
     * @param high
     * @returns
     */
    lineHandler(low: Date, high: Date) {
        return (line: string) => {
            let md
            if(md = line.match(this.linePattern)) {
                const d = new Date(this.sanitise(md[1]))
                if(d < low) {
                    return -1
                } else if(d > high) {
                    return 1
                }
                return 0
            }
            throw new Error(`Unable to parse date on: "${line}"`)
        }
    }
}