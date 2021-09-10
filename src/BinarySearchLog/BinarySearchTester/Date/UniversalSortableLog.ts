import { Base } from "./Base"

export class UniversalSortableLog extends Base {
    linePattern = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2})/

    protected sanitise(dateIn: string) {
        return dateIn
    }
}