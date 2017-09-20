const fs = require("fs")

const InputStream = require("../InputStream")
const Tokenizer = require("../Tokenizer")
const Parser = require("../Parser")

module.exports = {
	parseFile: (file) => {
		let inputFile = fs.readFileSync(file)
		let inputStream = new InputStream(inputFile.toString())
		let tokenizer = new Tokenizer(inputStream)

		let parser = new Parser(tokenizer)
		return parser.parse()
	}
}