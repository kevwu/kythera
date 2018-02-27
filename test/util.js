const Parser = require("../parser/Parser")
const Compiler = require("../compiler/Compiler")

require("jest")

module.exports = {
	test: (name, input, {compile = true, only = false, skip = false} = {}) => {
		let parser = new Parser()

		parser.load(input)
		let program = parser.parse()

		if(skip) {
			test.skip(`[PARSE] ${name}`, () => {
				expect(program).toMatchSnapshot()
			})
		} else if(only) {
			test.only(`[PARSE] ${name}`, () => {
				expect(program).toMatchSnapshot()
			})
		} else {
			test(`[PARSE] ${name}`, () => {
				expect(program).toMatchSnapshot()
			})
		}

		if(compile) {
			let compiler = new Compiler()

			compiler.load(program)

			if(skip) {
				test.skip(`[COMPL] ${name}`, () => {
					expect(compiler.visitProgram().replace(/[\n\r]/g, '')).toMatchSnapshot()
				})
			} else if(only) {
				test.only(`[COMPL] ${name}`, () => {
					expect(compiler.visitProgram().replace(/[\n\r]/g, '')).toMatchSnapshot()
				})
			} else {
				test(`[COMPL] ${name}`, () => {
					expect(compiler.visitProgram().replace(/[\n\r]/g, '')).toMatchSnapshot()
				})
			}
		}

		// TODO add "exec" option as the compiler matures
	}
}