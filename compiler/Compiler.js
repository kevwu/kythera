const Scope = require("./Scope")
const NodeType = require("./runtime").type

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
		switch(node.kind) {
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
		switch(node.kind) {
			case "new":
				return this.visitNew(node)
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
		switch(node.type) {
			case "int":
			case "float":
			case "bool":
			case "str":
			case "null":
			case "type":
				return this.makeValueConstructor(node.value, new NodeType(node.type))
			case "fn":
				return this.makeValueConstructor(
					{parameters: node.parameters, body: node.body, returns: node.returns},
					new NodeType("fn", {
						parameters: node.parameters.map((param, i) => {
							return this.getNodeType(param.type, param.structure)
						}),
						returns: this.getNodeType(node.returns)
					})
				)
			case "obj":
				throw new Error("Not yet implemented")
			default:
				throw new Error("Unhandled type: " + node.type)
		}
	}

	visitNew(node) {
		let targetType = this.getNodeType(node.target)
		console.log("Target type for new:")
		console.log(JSON.stringify(targetType, null, 2))

		switch(targetType.type) {
			case "int":
				return ``
		}

		return ""
	}

	visitLet(node) {
		let targetType = this.getNodeType(node.value)
		this.currentScope.create(node.identifier, targetType)
		return `let ${node.identifier} = ${this.visitExpressionNode(node.value)}`
	}

	visitAssign(node) {
		if(node.left.kind === "identifier") {
			let lhsType = this.getNodeType(node.left)
			let rhsType = this.getNodeType(node.right)
			if(!this.currentScope.get(node.left.name).eq(rhsType)) {
				throw new Error(`Cannot assign ${rhsType.type} value to ${node.left.name}, which has type ${lhsType.type}`)
			} else {
				return `${node.left.name} = ${this.visitExpressionNode(node.right)}`
			}
		} else if(node.left.kind === "objAccess" || node.left.kind === "access") {
			throw new Error("Writing to object member not yet supported")
		} else {
			throw new Error(`${node.left.kind} is not valid as an assignment target`)
		}
	}

	// TODO check return type against what the function expects
	// we can do that by storing function info with the scope
	visitReturn(node) {
		if(this.currentScope.isInFunction()) {
			return `return ${this.visitExpressionNode(node.value)}`
		}
	}

	// returns NodeType structure as would be stored/returned from Scope
	getNodeType(node) {
		let res
		switch(node.kind) {
			// TODO i think literal and type can be combined
			case "literal":
				let structure = {}
				if(node.type === "fn") {
					structure = {
						parameters: node.parameters.map((param, i) => {
							return this.getNodeType(param.type)
						}),
						returns: this.getNodeType(node.returns)
					}
				}

				if(node.type === "obj") {
					throw new Error("Not yet implemented")
				}

				return new NodeType(node.type, structure)
			case "type":
				res = {}
				res.type = node.type

				if(res.type === "fn") {
					res.structure = {
						parameters: node.parameters.map((param, i) => {
							return this.getNodeType(param)
						}),
						returns: this.getNodeType(node.returns)
					}
				}

				if(res.type === "obj") {
					throw new Error("Not yet implemented")
				}
				return res
			case "identifier":
				return this.currentScope.get(node.name)
			case "new":
				return this.getNodeType(node.target)
			default:
				throw new Error(`Cannot find type for ${node.kind}`)
		}
	}

	// returns the runtime-side constructor call string for a new KYTHERA.value
	makeValueConstructor(value, nodeType = null) {
		let out = `new KYTHERA.value(`
		if(nodeType.type === "str") {
			value = `"${value}"`
		}
		if(nodeType.type === "fn") {
			/*
			expects:
			value.parameters to be an assoc. array: name (string) => NodeType
			 */


			// extend scope one level
			this.currentScope = new Scope(this.currentScope, "function")

			let fn = "("
			// build parameter list and bring parameters into scope
			value.parameters.forEach((param, i) => {
				this.currentScope.create(param.name, this.getNodeType(param))
				fn += param.name
				if(i !== value.parameters.length - 1) {
					fn += ","
				}
			})

			fn += ') => {\n'

			// TODO verify that the function returns
			// build body statements
			value.body.forEach((statement, i) => {
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
		}

		out += value

		out += `, ${this.makeTypeConstructor(nodeType)})`

		return out
	}

	// returns the runtime-side constructor call string for a KYTHERA.type
	makeTypeConstructor(nodeType) {
		let out = `new KYTHERA.type("${nodeType.type}"`

		if(nodeType.type === "fn") {

		} else if(nodeType.type === "obj") {

		} else {
			out += ")"
		}

		return out
	}
}

module.exports = Compiler