import { DateBase } from "./DateBase"

export class Syslog extends DateBase {
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