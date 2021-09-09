import { DateBase } from "./DateBase"

export class UniversalSortableLog extends DateBase {
    linePattern = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2})/

    protected sanitise(dateIn: string) {
        return dateIn
    }
}