const fs = require("fs")
const Parser = require("./parser/Parser")
const Compiler = require("./compiler/Compiler")

try {
	let parser = new Parser(fs.readFileSync(process.argv[2]).toString())
	let ast = parser.parse()

	console.log(JSON.stringify(ast, null, 2))

	let compiler = new Compiler(ast)
	let output = compiler.visitProgram()
	console.log("Compilation complete:")
	console.log(output)

	console.log("Executing...")
	output = `const KYTHERA = require("./compiler/runtime");` + output
	eval(output)
} catch(e) {
	console.log(e)
	return
}