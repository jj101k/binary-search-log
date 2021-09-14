import { Base } from "./Base"

export class Syslog extends Base {
    static description = "Normal syslog format, eg. /var/log/messages"

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