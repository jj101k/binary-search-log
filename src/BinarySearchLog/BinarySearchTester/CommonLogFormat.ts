import { DateBase } from "./DateBase"

export class CommonLogFormat extends DateBase {
    linePattern = /^(?:"[^"]*"|\S+) (?:"[^"]*"|\S+) (?:"[^"]*"|\S+) \[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4})\]/

    protected sanitise(dateIn: string) {
        return dateIn.replace(/(\d{4}):/, "$1 ")
    }
}