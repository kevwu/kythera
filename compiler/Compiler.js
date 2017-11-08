const Scope = require("./Scope")

// runtime-side representations of values and types
const KytheraValue = require("./runtime").value
const KytheraType = require("./runtime").type

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
			return prev + this.visitNode(node) + ';\n'
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
	// every expression returns a tuple: the string output and the KytheraType of the result.
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
			case "typeof":
				return this.visitTypeof(node)
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
					output: this.makeValueConstructor(new KytheraValue(node.value, KytheraType.PRIMITIVES[node.type.type])),
					type: KytheraType.PRIMITIVES[node.type.type]
				}
			case "type":
				return {
					output: this.makeValueConstructor(new KytheraValue(this.makeKytheraType(node.value), KytheraType.PRIMITIVES.type)),
					type: KytheraType.PRIMITIVES.type
				}
			case "fn":
				// A function cannot be constructed from a runtime value at compile-time; we must compile directly.

				let fnType = this.makeKytheraType(node.type)

				// extend scope one level
				this.currentScope = new Scope(this.currentScope, {type: "function", returns: fnType.structure.returns})

				let fn = "("

				// build parameter list and bring parameters into scope
				fn += node.parameters.reduce((prev, param, i) => {
					this.currentScope.create(param.name, fnType.structure.parameters[i])
					return prev + param.name + ((i !== node.parameters.length - 1) ? "," : "")
				}, "")

				fn += ') => {\n'

				// TODO verify that the function returns
				// build body statements
				fn += node.body.reduce((prev, statement, i) => {
					return prev + this.visitNode(statement) + ';\n'
				}, "")

				fn += '}'

				// return to previous scope
				this.currentScope = this.currentScope.parent

				return {
					output: `new KYTHERA.value(${fn}, ${this.makeTypeConstructor(fnType)})`,
					type: fnType
				}
			case "obj":
				let objType = this.makeKytheraType(node.type)
				return {
					output: this.makeValueConstructor(new KytheraValue(node.value, objType)),
					type: objType
				}
			case "list":
				if(node.elements.length === 0) {
					throw new Error("Cannot have empty list literal.")
				}

				let listType = this.makeKytheraType(node.type)
				let containsType = null

				let list = "["

				list += node.elements.reduce((prev, elem, i) => {
					let listExp = this.visitExpressionNode(elem)
					if(containsType === null) {
						containsType = listExp.type
					} else {
						if(!KytheraType.eq(containsType, listExp.type)) {
							throw new Error(`List types do not match, expecting ${containsType.type} but got ${listExp.type.type}`)
						}
					}
					return prev + listExp.output + ((i !== node.elements.length-1) ? "," : "")
				}, "")

				list += "]"

				return {
					output: `new KYTHERA.value(${list}, ${this.makeTypeConstructor(listType)})`,
					type: listType
				}
			default:
				throw new Error("Unhandled type: " + node.type.type)
		}
	}

	visitNew(node) {
		let targetType = this.makeKytheraType(node.target)

		// TODO support for custom named types
		return {
			output: this.makeTypeConstructor(targetType) + ".makeNew()",
			type: targetType
		}
	}

	visitLet(node) {
		let result = this.visitExpressionNode(node.value)
		this.currentScope.create(node.identifier, result.type)
		return `let ${node.identifier} = ${result.output}`
	}

	visitAssign(node) {
		if(node.left.kind === "identifier") {
			// let lhsType = this.makeKytheraType(node.left)
			let lhsType = this.currentScope.get(node.left.name)
			let rhs = this.visitExpressionNode(node.right)
			if(!KytheraType.eq(lhsType, rhs.type)) {
				throw new Error(`Cannot assign ${rhs.type.type} value to ${node.left.name}, which has type ${lhsType.type}`)
			} else {
				return `${node.left.name} = ${rhs.output}`
			}
		} else if(node.left.kind === "objAccess" || node.left.kind === "access") {
			throw new Error("Writing to object member not yet supported")
		} else {
			throw new Error(`${node.left.kind} is not valid as an assignment target`)
		}
	}

	visitReturn(node) {
		if(this.currentScope.isInFunction()) {
			let returnVal = this.visitExpressionNode(node.value)

			if(!(KytheraType.eq(returnVal.type, this.currentScope.getReturnType() ))) {
				throw new Error(`Expected return value of type ${this.currentScope.getReturnType().type} but got ${returnVal.type.type}`)
			}

			return `return ${returnVal.output}`
		} else {
			throw new Error("Return used outside of function scope")
		}
	}

	visitTypeof(node) {
		return {
			output: this.makeTypeConstructor(this.visitExpressionNode(node.target).type),
			type: KytheraType.PRIMITIVES.type,
		}
	}

	// transform a type ParseNode into a KytheraType
	makeKytheraType(node) {
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
				return KytheraType.PRIMITIVES[node.type]
			case "fn":
				return new KytheraType(node.type, {
					parameters: node.parameters.map((param, i) => {
						return this.makeKytheraType(param)
					}),
					returns: this.makeKytheraType(node.returns)
				})
			case "obj":
				let structure = {}
				Object.entries(node.structure).forEach(([key, value], i) => {
					structure[key] = this.makeKytheraType(value)
				})
				return new KytheraType(node.type, structure)
			case "list":
				return new KytheraType(node.type, {
					contains: this.makeKytheraType(node.contains)
				})
			default:
				throw new Error("Invalid builtin type: " + node.type)
		}
	}

	// make runtime-side constructor call for a KYTHERA.value
	makeValueConstructor(kytheraValue) {
		if(!(kytheraValue instanceof KytheraValue)) {
			throw new Error("Value must be a Kythera runtime value.")
		}
		// it is now safe to assume that the value corresponds to the type and type structure

		let kytheraType = kytheraValue.type

		let out = `new KYTHERA.value(`
		if(kytheraType.type === "str") {
			out += `"${kytheraValue.value}"`
		} else if(kytheraType.type === "fn") {
			// see visitLiteral()
			throw new Error("Functions cannot be constructed from existing runtime values at compile time.")
		} else if(kytheraType.type === "obj") {
			out += "{"

			out += Object.entries(kytheraValue.value).reduce((prev, [key, val], i) => {
				return prev + `"${key}": ${this.visitExpressionNode(val).output},`
			}, "")

			out += "}"
		} else if(kytheraType.type === "type") {
			out += this.makeTypeConstructor(kytheraValue.value)
		} else {
			out += kytheraValue.value
		}

		out += `, ${this.makeTypeConstructor(kytheraType)})`

		return out
	}

	// make runtime-side constructor call for a KYTHERA.type, from a KYTHERA.type. This wrinkles my brain
	makeTypeConstructor(kytheraType) {
		if(!(kytheraType instanceof KytheraType)) {
			throw new Error("Type must be a Kythera runtime type.")
		}
		let out = `new KYTHERA.type("${kytheraType.type}"`

		if(kytheraType.type === "fn") {
			out += ", { parameters: ["

			out += kytheraType.structure.parameters.reduce((prev, param, i) => {
				return prev + this.makeTypeConstructor(param) + ((i < kytheraType.structure.parameters.length - 1) ? "," : "")
			}, "")

			out += `], returns: ${this.makeTypeConstructor(kytheraType.structure.returns)}}`
		} else if(kytheraType.type === "obj") {
			out += ", {"

			out += Object.entries(kytheraType.structure).reduce((prev, [key, val], i) => {
				return prev + `"${key}": ${this.makeTypeConstructor(val)},`
			}, "")

			out += "}"
		} else if(kytheraType.type === "list") {
			out += `, { contains: ${this.makeTypeConstructor(kytheraType.structure.contains)}}`
		} else {
			return `KYTHERA.type.PRIMITIVES["${kytheraType.type}"]`
		}
		out += ")"
		return out
	}
}

module.exports = Compiler