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
	program = parser.parse()

	console.log(JSON.stringify(program, null, 2))
} catch(e) {
	console.log(e)
	return
}
