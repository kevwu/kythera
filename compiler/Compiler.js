Scope = require("./Scope")

// for comparison with scope types
const TYPES = {
	int: {
		type: "int"
	},
	float: {
		type: "float"
	},
	bool: {
		type: "bool",
	},
	str: {
		type: "str"
	},
	"null": {
		type: "null",
	},
	fn: {
		type: "fn",
		structure: {
			returns: { // returns a null
				type: "null",
			},
			parameters: [],
		}
	},
	obj: {
		type: "fn",
		structure: []
	}
}

// TODO distinguish errors from bad parsing from errors during compilation
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

	// main statement dispatcher
	visitNode(node) {
		switch (node.kind) {
			// statements
			case "let":
				return this.visitLet(node)
			case "assign":
				return this.visitAssign(node)
			case "return":
				return this.visitReturn(node)
			default:
				return this.visitExpressionNode(node)
		}
	}

	// expression node dispatcher
	visitExpressionNode(node) {
		switch (node.kind) {
			case "identifier":
				// TODO validate identifiers as ES6 idents
				return node.name
			case "literal":
				return this.visitLiteral(node)
			default:
				throw new Error("Unhandled node kind: " + node.kind)
		}
	}

	visitLiteral(node) {
		switch (node.type) {
			case "int":
				return `new KYTHERA.value(${node.value}, "int");`
			case "float":
				return `new KYTHERA.value(${node.value}, "float");`
			case "bool":
				return `new KYTHERA.value(${node.value}, "bool");`
			case "str":
				return `new KYTHERA.value(${node.value}, "str");`
			case "null":
				return `new KYTHERA.value(${node.value}, "null");`
			case "fn":
				// extend scope one level
				this.currentScope = new Scope(this.currentScope, "function")

				let fn = "("
				// build parameter list and bring parameters into scope
				node.parameters.forEach((param, i) => {
					let paramStructure = null
					this.currentScope.create(param.name, param.type.type, paramStructure)
					fn += param.name
					if (i !== node.parameters.length - 1) {
						fn += ","
					}
				})

				fn += ') => {\n'

				// TODO verify that the function returns
				// build body statements
				node.body.forEach((statement, i) => {
					fn += this.visitNode(statement) + '\n'
				})

				fn += '}'

				let structure = {
					parameters: node.parameters.map((param, i) => {
						return this.getNodeType(param.type)
					}),
					returns: this.getNodeType(node.returns)
				}

				return `new KYTHERA.value("fn", ${fn}, ${JSON.stringify(structure)})`
			case "obj":

			default:
				throw new Error("Unhandled type: " + node.type)
		}
	}

	visitLet(node) {
		let targetType = this.getNodeType(node.value)
		this.currentScope.create(node.identifier, targetType.type, targetType.structure)
		return `let ${node.identifier} = ${this.visitExpressionNode(node.value)}`
	}

	visitAssign(node) {
		if (node.left.kind === "identifier") {
			let lhsType = this.getNodeType(node.left)
			let rhsType = this.getNodeType(node.right)
			if (!this.eqNodeType(this.currentScope.get(node.left.name), rhsType)) {
				throw new Error(`Cannot assign ${rhsType.type} value to ${node.left.name}, which has type ${lhsType.type}`)
			} else {
				return `${node.left.name} = ${this.visitExpressionNode(node.right)}`
			}
		} else if (node.left.kind === "objAccess" || node.left.kind === "access") {
			throw new Error("Writing to object member not yet supported")
		} else {
			throw new Error(`${node.left.kind} is not valid as an assignment target`)
		}
	}

	// TODO check return type against what the function expects
	// we can do that by storing function info with the scope
	visitReturn(node) {
		if (this.currentScope.isInFunction()) {
			return `return ${this.visitExpressionNode(node.value)}`
		}
	}

	// returns type structure as would be stored/returned from Scope
	getNodeType(node) {
		let res
		switch (node.kind) {
			case "literal":
				res = {}
				res.type = node.type
				if (res.type === "fn") {
					res.structure = {
						parameters: node.parameters.map((param, i) => {
							return this.getNodeType(param.type)
						}),
						returns: this.getNodeType(node.returns)
					}
				}

				if (res.type === "obj") {
					throw new Error("Not yet implemented")
				}

				return res
			case "type":
				res = {}
				res.type = node.type

				if (res.type === "fn") {
					res.structure = {
						parameters: node.parameters.map((param, i) => {
							return this.getNodeType(param)
						}),
						returns: this.getNodeType(node.returns)
					}
				}

				if (res.type === "obj") {
					throw new Error("Not yet implemented")
				}
				return res
			case "identifier":
				return this.currentScope.get(node.name)
			default:
				throw new Error(`Cannot find type for ${node.kind}`)
		}
	}

	// compare two node types
	eqNodeType(a, b) {
		if (a.type !== b.type) {
			return false
		}

		if (a.type === "fn") {
			if (!this.eqNodeType(a.structure.returns, b.structure.returns)) {
				return false
			}

			if (a.structure.parameters.length !== a.structure.parameters.length) {
				return false
			}

			for (let i = 0; i < a.structure.parameters.length; i += 1) {
				if (!this.eqNodeType(a.structure.parameters[i], b.structure.parameters[i])) {
					return false
				}
			}
			return true
		}

		if (a.type === "obj") {
			if (Object.keys(a.structure).length !== Object.keys(b.structure).length) {
				return false
			}

			return !Object.keys(a.structure).every((key, i) => this.eqNodeType(a.structure[key], b.structure[key]));
		}

		return true
	}
}

module.exports = Compiler