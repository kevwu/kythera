const fs = require("fs")
const Parser = require("./parser/Parser")
const Compiler = require("./compiler/Compiler")

try {
	let parser = new Parser(fs.readFileSync(process.argv[2]).toString())
	let program = parser.parse()

	console.log(JSON.stringify(program, null, 2))

	let compiler = new Compiler(program)
	console.log(compiler.visitProgram())
} catch(e) {
	console.log(e)
	return
}
