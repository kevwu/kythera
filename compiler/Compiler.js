class Compiler {
	constructor(program) {
		this.program = program

		// symbol table
		this.symbols = []
	}

	visitProgram() {
		let out = ""
		this.program.forEach((node) => {
			out += this.visitNode(node)
			console.log(out)
		})

		return out
	}

	// main dispatcher
	visitNode(node) {
		switch(node.kind) {
			case "literal":
				return this.visitLiteral(node)
			case "let":
				return this.visitLet(node)
			default:
				throw new Error("Unhandled node kind: " + node.kind)
		}
	}

	visitLiteral(node) {
		switch(node.type) {
			case "int":
				if(typeof node.value === "number" && isFinite(node.value) && (node.value % 1 === 0)) {
					return `new KYTHERA.value(${node.value}, "int")`
				} else {
					throw new Error("int literal used but value was not an integer")
				}
				break
			case "float":
				if(typeof node.value === "number" && isFinite(node.value)) {
					return `new KYTHERA.value(${node.value}, "float")`
				} else {
					throw new Error("float literal used but value was not a valid number")
				}
				break
			case "bool":
				if(typeof node.value === "boolean") {
					return `new KYTHERA.value(${node.value}, "bool")`
				} else {
					throw new Error("bool literal used but value was not a boolean")
				}
			default:
				throw new Error("Unhandled type: " + node.type)
		}
	}

	visitLet(node) {
		return `let ${node.identifier} = ${this.visitNode(node.value)}`
	}
}

module.exports = Compiler