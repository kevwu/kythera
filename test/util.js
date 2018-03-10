const Parser = require("../parser/Parser")
const Compiler = require("../compiler/Compiler")

require("jest")

module.exports = {
	test: (name, input, {compile = true, exec = true, only = false, skip = false} = {}) => {
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

		if(compile && !skip) {
			let compiler = new Compiler()

			compiler.load(program)
			let output = compiler.visitProgram()

			if(skip) {
				test.skip(`[COMPL] ${name}`, () => {
					expect(output.replace(/[\n\r]/g, '')).toMatchSnapshot()
				})
			} else if(only) {
				test.only(`[COMPL] ${name}`, () => {
					expect(output.replace(/[\n\r]/g, '')).toMatchSnapshot()
				})
			} else {
				test(`[COMPL] ${name}`, () => {
					expect(output.replace(/[\n\r]/g, '')).toMatchSnapshot()
				})
			}

			let execOutput = output

			if(exec) {
				execOutput = `const KYTHERA = require("../compiler/runtime");\n` + output
				execOutput += `var evalResult = {\n`
				Object.keys(compiler.rootScope.symbols).forEach((sym, i) => {
					execOutput += `"${sym}": ${sym},\n`
				})
				execOutput += "};"

				eval(execOutput)

				if(skip) {
					test.skip(`[EVALT] ${name}`, () => {
						expect(evalResult).toMatchSnapshot()
					})
				} else if(only) {
					test.only(`[EVALT] ${name}`, () => {
						expect(evalResult).toMatchSnapshot()
					})
				} else {
					test(`[EVALT] ${name}`, () => {
						expect(evalResult).toMatchSnapshot()
					})
				}
			}
		}
	}
}