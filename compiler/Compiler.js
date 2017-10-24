const Scope = require("./Scope")
const NodeType = require("./runtime").type

class Compiler {
	constructor(program = null) {
		if(program !== null) {
			this.load(program)
		}
	}

	load(program) {
		this.program = program

		// symbol table
		this.rootScope = new Scope()
		this.currentScope = this.rootScope
	}

	// compile
	visitProgram() {
		if(typeof this.program !== "object") {
			throw new Error("No program is loaded.")
		}

		// clear symbol table
		this.rootScope = new Scope()
		this.currentScope = this.rootScope

		return this.program.reduce((prev, node) => {
			let prog = prev + this.visitNode(node) + ';\n'
			console.log(prog)
			return prog
		}, "")
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
				return { output:this.visitNew(node) }
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
		switch(node.type.type) {
			case "int":
			case "float":
			case "bool":
			case "str":
			case "null":
				return {
					output: this.makeValueConstructor(node.value, NodeType.PRIMITIVES[node.type.type]),
					type: NodeType.PRIMITIVES[node.type.type]
				}
			case "type":
				return {
					output: this.makeValueConstructor(this.makeNodeType(node.value), NodeType.PRIMITIVES.type),
					type: NodeType.PRIMITIVES.type
				}
			case "fn":
				let fnType = this.makeNodeType(node.type)
				return {
					output: this.makeValueConstructor(
						{parameters: node.parameters, body: node.body, returns: node.returns},
						fnType
					),
					type: fnType
				}
			case "obj":
				let objType = this.makeNodeType(node.type)
				return {
					output: this.makeValueConstructor(node.value, objType),
					type: objType
				}
			default:
				throw new Error("Unhandled type: " + node.type)
		}
	}

	visitNew(node) {
		let targetType = this.makeNodeType(node.target)
		console.log("Target type for new:")
		console.log(JSON.stringify(targetType, null, 2))

		// "new" initializes a variable to its zero-value:
		switch(targetType.type) {
			case "int": // 0
				return this.makeValueConstructor(0, new NodeType("int"))
			case "float": // 0.0
				return this.makeValueConstructor(0.0, new NodeType("float"))
			case "bool": // false
				return this.makeValueConstructor(false, new NodeType("bool"))
			case "str": // "" (empty string)
				return this.makeValueConstructor("", new NodeType("str"))
			case "null": // null
				return this.makeValueConstructor(null, new NodeType("null"))
			case "type": // literal type
				return this.makeValueConstructor(NodeType.PRIMITIVES.type, new NodeType("type"))
			case "fn": // an empty function that contains only a "return new" of the return type
				return this.makeValueConstructor({
					parameters: targetType.structure.parameters.map((param, i) => {
						return {
							// TODO make parameter name generation robust (check against current scope for conflicts)
							name: `fn_${i}`,
							type: param
						}
					}),
					// TODO this is a hard-coded value that will not update if the parser output does. Make this more resilient
					body: [],
				}, new NodeType("fn", {
					parameters: targetType.structure.parameters,
					returns: targetType.structure.returns,
				}))
			case "obj":
				throw new Error("Not yet implemented.")
			default:
				throw new Error("Invalid type for new: " + targetType.type)
		}
	}

	visitLet(node) {
		let result = this.visitExpressionNode(node.value)
		this.currentScope.create(node.identifier, result.type)
		return `let ${node.identifier} = ${result.output}`
	}

	visitAssign(node) {
		if(node.left.kind === "identifier") {
			// let lhsType = this.makeNodeType(node.left)
			let lhsType = this.currentScope.get(node.left.name)
			let rhs = this.visitExpressionNode(node.right)
			if(!this.currentScope.get(node.left.name).eq(rhs.type)) {
				throw new Error(`Cannot assign ${rhs.type} value to ${node.left.name}, which has type ${lhsType.type}`)
			} else {
				return `${node.left.name} = ${rhs.output}`
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
			case "type":
				return NodeType.PRIMITIVES[node.type]
			case "fn":
				return new NodeType(node.type, {
					parameters: node.parameters.map((param, i) => {
						return this.makeNodeType(param)
					}),
					returns: this.makeNodeType(node.returns)
				})
			case "obj":
				let structure = {}
				Object.entries(node.structure).forEach(([key, value], i) => {
					structure[key] = this.makeNodeType(value)
				})
				return new NodeType(node.type, structure)
			case "list":
				throw new Error("Not yet implemented")
			default:
				throw new Error("Invalid builtin type: " + node.type)
		}
	}

	// runtime-side constructor call string for a new KYTHERA.value
	makeValueConstructor(value, nodeType) {
		let out = `new KYTHERA.value(`
		if(nodeType.type === "str") {
			out += `"${value}"`
		} else if(nodeType.type === "fn") {
			// extend scope one level
			this.currentScope = new Scope(this.currentScope, "function")

			out += "("
			// build parameter list and bring parameters into scope
			out += value.parameters.reduce((prev, param, i) => {
				this.currentScope.create(param.name, nodeType.structure.parameters[i])
				return prev + param.name + ((i !== value.parameters.length - 1) ? "," : "")
			}, "")

			out += ') => {\n'

			// TODO verify that the function returns
			// build body statements
			out += value.body.reduce((prev, statement, i) => {
				return prev + this.visitNode(statement) + ';\n'
			}, "")

			out += '}'
		} else if(nodeType.type === "obj") {
			out += "{"

			out += Object.entries(value).reduce((prev, [key, val], i) => {
				return prev + `"${key}": ${this.visitExpressionNode(val).output},`
			}, "")

			out += "}"
			// TODO nodeType.type === "type"
		} else if(nodeType.type === "type") {
			if(!(value instanceof NodeType)) {
				throw new Error("Value for a type must be a NodeType")
			}

			out += this.makeTypeConstructor(value)
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

			out += nodeType.structure.parameters.reduce((prev, param, i) => {
				return prev + this.makeTypeConstructor(param) + ((i < nodeType.structure.parameters.length - 1) ? "," : "")
			}, "")

			out += `], returns: ${this.makeTypeConstructor(nodeType.structure.returns)}}`
		} else if(nodeType.type === "obj") {
			out += ", {"

			out += Object.entries(nodeType.structure).reduce((prev, [key, val], i) => {
				return prev + `"${key}": ${this.makeTypeConstructor(val)},`
			}, "")

			out += "}"
		} else if(nodeType.type === "list") {

		} else {
			return `KYTHERA.type.PRIMITIVES["${nodeType.type}"]`
		}
		out += ")"
		return out
	}
}

module.exports = Compiler