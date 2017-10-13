const fs = require("fs")
const Parser = require("./parser/Parser")

try {
	parser = new Parser(fs.readFileSync(process.argv[2]).toString())
	program = parser.parse()

	console.log(JSON.stringify(program, null, 2))
} catch(e) {
	console.log(e)
	return
}
