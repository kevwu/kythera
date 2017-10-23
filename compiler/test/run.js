const Parser = require("../../parser/Parser")
const Compiler = require("../Compiler")

let t = (name, statement) => {
	let parser = new Parser()
	let compiler = new Compiler()

	parser.load(statement)
	compiler.load(parser.parse())
	test(name, () => {
		expect(compiler.visitProgram().replace(/[\n\r]/g, '')).toMatchSnapshot()
	})
}

module.exports = t