import { Base } from "./Base"

export class UniversalSortableLog extends Base {
    static description = "Lines starting with a date like \"1999-12-31 23:59:59\""

    linePattern = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2})/

    protected sanitise(dateIn: string) {
        return dateIn
    }
}