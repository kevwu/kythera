const fs = require("fs")

const InputStream = require("./InputStream")
const Tokenizer = require("./Tokenizer")
const Parser = require("./Parser")


let inputFile
try {
	inputFile = fs.readFileSync(process.argv[2])

	inputStream = new InputStream(inputFile.toString())
	tokenizer = new Tokenizer(inputStream)


	parser = new Parser(tokenizer)
	parser.parse()
	// let ast = parser.parseProgram()
	// console.log(JSON.stringify(ast))

} catch(e) {
	console.log(e)
	return
}
