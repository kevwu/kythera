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
			out += this.visitNode(node) + ';\n'
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
				return this.visitExpressionNode(node).output
		}
	}

	// expression node dispatcher
	// every expression returns a tuple: the string output and the NodeType of the result.
	visitExpressionNode(node) {
		switch(node.kind) {
			case "new":
				return this.visitNew(node)
			case "identifier":
				if(this.currentScope.has(node.name)) {
					return {
						output: node.name,
						type: this.currentScope.get(node.name)
					}
				} else {
					throw new Error("Undefined variable: " + node.name)
				}
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
				return {
					output: this.makeValueConstructor(node.value, NodeType.PRIMITIVES[node.type]),
					type: NodeType.PRIMITIVES[node.type]
				}
			case "type":
				return {
					output: this.makeValueConstructor(this.makeTypeConstructor(new NodeType(node.value)), NodeType.PRIMITIVES.type),
					type: NodeType.PRIMITIVES.type
				}
			case "fn":
				// function type information is not included with the literal, it must be derived
				let fnType = new NodeType("fn", {
					parameters: node.parameters.map((param, i) => {
						return this.makeNodeType(param.type)
					}),
					returns: this.makeNodeType(node.returns)
				})
				return {
					output: this.makeValueConstructor(
						{parameters: node.parameters, body: node.body, returns: node.returns},
						fnType
					),
					type: fnType
				}
			case "obj":
				// object type information is not included with the literal, it must be derived
				throw new Error("Not yet implemented")
			default:
				throw new Error("Unhandled type: " + node.type)
		}
	}

	visitNew(node) {
		let targetType = this.makeNodeType(node.target)
		console.log("Target type for new:")
		console.log(JSON.stringify(targetType, null, 2))

		switch(targetType.type) {
			case "int":
				return this.makeValueConstructor(0, new NodeType("int"))
		}
	}

	visitLet(node) {
		let result = this.visitExpressionNode(node.value)
		this.currentScope.create(node.identifier, result.type)
		return `let ${node.identifier} = ${result.output}`
	}

	visitAssign(node) {
		if(node.left.kind === "identifier") {
			let lhsType = this.makeNodeType(node.left)
			let rhsType = this.makeNodeType(node.right)
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
			return `return ${this.visitExpressionNode(node.value).output}`
		}
	}

	// transform a type ParseNode into a NodeType
	makeNodeType(node) {
		if(node.kind !== "type") {
			throw new Error("Expected a type ParseNode but got " + JSON.stringify(node, null, 2))
		}

		if(node.name) {
			throw new Error("named types not yet supported")
		}

		switch(node.type) {
			case "int":
			case "float":
			case "bool":
			case "str":
			case "null":
				return NodeType.PRIMITIVES[node.type]
			case "fn":
				return new NodeType(node.type, {
					parameters: node.parameters.map((param, i) => {
						return this.makeNodeType(param.type)
					}),
					returns: this.makeNodeType(node.returns)
				})
			case "obj":
				let structure = {}
				Object.entries(node.structure).forEach(([key, value], i) => {
					structure[key] = this.makeNodeType(value)
				})
				return new NodeType(node.type, structure)
			default:
				throw new Error("Invalid builtin type: " + node.type)
		}
	}

	// returns the runtime-side constructor call string for a new KYTHERA.value
	makeValueConstructor(value, nodeType) {
		let out = `new KYTHERA.value(`
		if(nodeType.type === "str") {
			out += `"${value}"`
		} else if(nodeType.type === "fn") {
			// extend scope one level
			this.currentScope = new Scope(this.currentScope, "function")

			out += "("
			// build parameter list and bring parameters into scope
			value.parameters.forEach((param, i) => {
				this.currentScope.create(param.name, nodeType.structure.parameters[i])
				out += param.name
				if(i !== value.parameters.length - 1) {
					out += ","
				}
			})

			out += ') => {\n'

			// TODO verify that the function returns
			// build body statements
			value.body.forEach((statement, i) => {
				out += this.visitNode(statement) + ';\n'
			})

			out += '}'
		} else {
			out += value
		}

		out += `, ${this.makeTypeConstructor(nodeType)})`

		return out
	}

	// runtime-side constructor call string for a KYTHERA.type, from a KYTHERA.type. This wrinkles my brain
	makeTypeConstructor(nodeType) {
		let out = `new KYTHERA.type("${nodeType.type}"`

		if(nodeType.type === "fn") {
			out += ", { parameters: ["

			nodeType.structure.parameters.forEach((param, i) => {
				out += this.makeTypeConstructor(param)

				if(i < nodeType.structure.parameters.length - 1) {
					out += ","
				}
			})

			out += `], returns: ${JSON.stringify(nodeType.structure.returns)}}`
		} else if(nodeType.type === "obj") {

		} else if(nodeType.type === "list") {

		} else {
			return `KYTHERA.type.PRIMITIVES["${nodeType.type}"]`
		}
		out += ")"

		return out
	}
}

module.exports = Compiler