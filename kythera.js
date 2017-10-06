const fs = require("fs")
const Parser = require("./parser/Parser")
const Compiler = require("./compiler/Compiler")

try {
	parser = new Parser(fs.readFileSync(process.argv[2]).toString())
	program = parser.parse()

	console.log(JSON.stringify(program, null, 2))

	compiler = new Compiler(program)
	let output = compiler.visitProgram()

	console.log(output)
} catch(e) {
	console.log(e)
	return
}
