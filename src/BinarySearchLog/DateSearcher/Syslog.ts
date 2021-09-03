import { Base } from "./Base"

export class Syslog extends Base {
    linePattern = /^(\w\w\w [ \d]\d \d\d:\d\d:\d\d)/

    /**
     *
     * @param assumedYear
     */
    constructor(private assumedYear: number) {
        super()
    }

    protected sanitise(dateIn: string) {
        return dateIn + " " + this.assumedYear
    }
}