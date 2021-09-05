import { Base } from "./Base"

export class Syslog extends Base {
    /**
     *
     */
    private get assumedYear() {
        return this.referenceDate.getFullYear()
    }

    linePattern = /^(\w\w\w [ \d]\d \d\d:\d\d:\d\d)/

    protected sanitise(dateIn: string) {
        return dateIn + " " + this.assumedYear
    }
}