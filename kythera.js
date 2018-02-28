const fs = require("fs")
const Parser = require("./parser/Parser")
const Compiler = require("./compiler/Compiler")

try {
	if (process.argv.length >= 3) { // run file
		const flags = {}
		process.argv.filter(flag => flag.charAt(0) === "-").forEach(flag => flags[flag.replace("-", "")] = true)

		let parser = new Parser(fs.readFileSync(process.argv[2]).toString())
		let ast = parser.parse()

		if(!flags.c) {
			console.log(JSON.stringify(ast, null, 2))
		}

		let compiler = new Compiler(ast)
		let output = `const KYTHERA = require("./compiler/runtime");\n` + compiler.visitProgram()
		if(!flags.c) {
			console.log("Compilation complete:")
		}
		console.log(output)

		if(!flags.c) {
			console.log("Executing...")
			eval(output)
		}
	} else { // REPL
		const readline = require("readline")
		const stdin = readline.createInterface(process.stdin, process.stdout)
		stdin.setPrompt("> ")

		let parser = new Parser()
		let compiler = new Compiler()

		stdin.prompt();

		stdin.on("line", (line) => {
			try {
				parser.load(line)
				let lineNodes = parser.parse()
				console.log(lineNodes)

				compiler.load(lineNodes, false)
				let result = compiler.visitProgram()

				console.log(result)
			} catch (e) {
				console.log(e)
			}

			stdin.prompt();
		})
	}
} catch (e) {
	console.log(e)
	return
}
