export class SearcherInfoFormatter {
    /**
     *
     */
    private get laterLinePrefix() {
        return this.linePrefix + "    ";
    }

    /**
     *
     */
    private get pattern() {
        return new RegExp(`(.{${this.viewWidth - this.laterLinePrefix.length - 4},${this.viewWidth - this.laterLinePrefix.length}})[ ]`, "g");
    }

    /**
     *
     * @param linePrefix
     * @param viewWidth
     */
    constructor(private linePrefix: string, private viewWidth: number = 80) {
    }

    /**
     * Returns a string formatting the name and description pair (description
     * will be indented).
     *
     * @param name
     * @param description
     * @returns
     */
    format(name: string, description: string) {
        return `${this.linePrefix}${name}\n` + this.laterLinePrefix + description.replace(this.pattern, `$1\n${this.laterLinePrefix}`);
    }
}
