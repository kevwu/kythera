const fs = require("fs")

const InputStream = require("./InputStream")
const Tokenizer = require("./Tokenizer")
const Parser = require("./Parser")
const Compiler = require("./compiler/Compiler")

let inputFile
try {
	inputFile = fs.readFileSync(process.argv[2])

	inputStream = new InputStream(inputFile.toString())
	tokenizer = new Tokenizer(inputStream)
	parser = new Parser(tokenizer)

	let program = parser.parse()
	console.log(JSON.stringify(program, null, 2))

	compiler = new Compiler(program)
	let output = compiler.visitProgram()

	console.log(output)
} catch(e) {
	console.log(e)
	return
}
