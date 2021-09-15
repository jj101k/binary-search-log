import * as LineFinder from "./LineFinder"
import * as BinarySearchTester from "./BinarySearchTester"
import * as Errors from "./Errors"

type nonAbstractBinarySearchTester<T> = {
    new(l: T | null, h: T | null, r?: T): BinarySearchTester.Base<T>
}

export class Factory {
    /**
     * The date handlers as a name-description map
     */
    static get dateHandlerDescriptions() {
        const out = new Map<string, string>()
        for(const [name, handlerClass] of Object.entries(BinarySearchTester.Date.Factory.dateHandlers)) {
            out.set(name, handlerClass.description)
        }
        for(const [name, handlerClass] of Object.entries(BinarySearchTester.Autodetect.Date.Factory.generalDateHandlers)) {
            out.set(name, handlerClass.description)
        }
        return out
    }

    /**
     *
     * @param by
     * @throws
     * @returns
     */
    public static getBinarySearchDateTester(by: string) {
        return BinarySearchTester.Autodetect.Date.Factory.getGeneralSearchTester(by)
    }

    /**
     *
     * @param by
     * @returns
     */
    public static getBinarySearchNumberTester(by: string) {
        const binarySearchTesters: {[name: string]: nonAbstractBinarySearchTester<number>} = {
            StartingTimestamp: BinarySearchTester.StartingTimestamp,
        }
        const c = binarySearchTesters[by]
        if(!c) {
            throw new Errors.Arguments(`No binary search tester named ${by}`)
        }
        return c
    }

    /**
     *
     * @param by
     * @returns
     */
    public static getLineFinder(by: "byte" | "line" = "line") {
        const lineFinder = {
            byte: LineFinder.ByByte,
            line: LineFinder.ByLine,
        }
        return lineFinder[by]
    }
}