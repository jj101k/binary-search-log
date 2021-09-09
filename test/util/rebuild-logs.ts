import * as TestLogFileData from "../src/TestLogFileData"
const logFileData = new TestLogFileData.Syslog(100, "test/data")
logFileData.build()