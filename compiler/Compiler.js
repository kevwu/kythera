Scope = require("./Scope")

class Compiler {
	constructor(program) {
		this.program = program

		// symbol table
		this.rootScope = new Scope()
		this.currentScope = this.rootScope
	}

	visitProgram() {
		let out = ""
		this.program.forEach((node) => {
			out += this.visitNode(node) + '\n'
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
			case "assign":
				return this.visitAssign(node)
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
		this.currentScope.create(node.identifier, node.value.type, node.value)
		return `let ${node.identifier} = ${this.visitNode(node.value)}`
	}

	visitAssign(node) {
		if(node.left.kind === "identifier") {
			let lhsType = this.getNodeType(node.left)
			let rhsType = this.getNodeType(node.right)
			if(this.currentScope.get(node.left.name) !== rhsType) {
				throw new Error(`Cannot assign ${rhsType} to ${node.left.name}, which is of type ${lhsType}`)
			} else {
				return `${node.left.name} = ${this.visitNode(node.right)}`
			}
		} else if(node.left.kind === "objAccess" || node.left.kind === "access") {
			throw new Error("Writing to object member not yet supported")
		} else {
			throw new Error(`${node.left.kind} is not valid as an assignment target`)
		}
	}

	getNodeType(node) {
		switch(node.kind) {
			case "literal":
				return node.type
			case "identifier":
				return this.currentScope.get(node.name)
			default:
				throw new Error(`Cannot find type for ${node.kind}`)
		}
	}
}

module.exports = Compiler