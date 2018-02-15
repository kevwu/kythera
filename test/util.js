const Parser = require("../parser/Parser")
const Compiler = require("../compiler/Compiler")

const fs = require("fs");

module.exports = {
	// compiles a new program containing only statement and tests the resulting output string.
	// does NOT execute or test against execution results.
	testOutput: (name, statement, only = false) => {
		let parser = new Parser()
		let compiler = new Compiler()

		parser.load(statement)
		compiler.load(parser.parse())
		if(only) {
			test.only(name, () => {
				expect(compiler.visitProgram().replace(/[\n\r]/g, '')).toMatchSnapshot()
			})
		} else {
			test(name, () => {
				expect(compiler.visitProgram().replace(/[\n\r]/g, '')).toMatchSnapshot()
			})
		}
	},
	parseFile: (file) => {
		let parser = new Parser(fs.readFileSync(file).toString())
		return parser.parse()
	}
}