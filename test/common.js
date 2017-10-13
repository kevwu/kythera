const fs = require("fs")
const Parser = require("../parser/Parser")

module.exports = {
	parseFile: (file) => {
		let parser = new Parser(fs.readFileSync(file).toString())
		return parser.parse()
	}
}