class ParseNode {
	constructor(kind, payload) {
		this.kind = kind

		// Internal sanity check: validate node kind and structure
		// This also serves as the de-facto listing of all node types and their expected structures
		let requiresType = true

		switch(kind) {
			case "unary":
				// only one unary operator right now
				if(payload.operator !== "!") {
					throw new Error("Invalid unary operator: " + payload.operator)
				}
				this.operator = payload.operator

				if(typeof payload.target.kind !== "string") {
					throw new Error("Unary target must be a Parse Node.")
				}

				this.target = payload.target

				this.type = this.target.type
				break
			case "binary":
				if(!["==", "!=", "<=", ">=", ">", "<", "+", "-", "*", "/", "%", "||", "&&"].includes(payload.operator)) {
					throw new Error("Invalid operator: " + payload.operator)
				}
				this.operator = payload.operator

				if(typeof payload.left.kind !== "string") {
					throw new Error("Missing left-hand side value.")
				}
				this.left = payload.left

				if(typeof payload.right.kind !== "string") {
					throw new Error("Missing right-hand side value.")
				}
				this.right = payload.right


				// Type-checking against the two operands is not done at the parsing stage.
				// We use the type of the LHS, which is also what the compiler does.
				this.type = this.left.type

				break
			case "assign":
				if(!["=", "+=", "-=", "*=", "/=", "%="].includes(payload.operator)) {
					throw new Error(`${payload.operator} is not an assignment operator.`)
				}
				this.operator = payload.operator

				if(typeof payload.left.kind !== "string") {
					throw new Error("Missing left-hand side value.")
				}
				this.left = payload.left

				if(typeof payload.right.kind !== "string") {
					throw new Error("Missing right-hand side value.")
				}
				this.right = payload.right

				this.type = this.right.type

				break
			case "literal":
				if(payload.type.kind !== "type") {
					throw new Error("Literal type must be a type node.")
				}

				this.type = payload.type

				// all literals are interpreted as builtin types. They can become named types by casting.
				switch(payload.type.baseType) {
					case "int":
						if(!(typeof payload.value === "number" && isFinite(payload.value) && (payload.value % 1 === 0))) {
							throw new Error("Value stored in int literal is not an integer.")
						}
						this.value = payload.value
						break
					case "float":
						if(!(typeof payload.value === "number" && isFinite(payload.value))) {
							throw new Error("Value stored in float literal is not a valid number.")
						}
						this.value = payload.value
						break
					case "bool":
						if(typeof payload.value !== "boolean") {
							throw new Error("Value stored in boolean literal is not boolean.")
						}
						this.value = payload.value
						break
					case "str":
						if(typeof payload.value !== "string") {
							throw new Error("Value stored in string literal is not a string.")
						}
						this.value = payload.value
						break
					case "null":
						if(payload.value !== null) {
							throw new Error("Value stored in null literal is not null")
						}
						this.value = payload.value
						break
					case "fn":
						if(!Array.isArray(payload.parameters)) {
							throw new Error("Parameters must be an array.")
						}

						if(!payload.parameters.every((param, i) => {
								return param.type.kind === "type"
							})) {
							throw new Error("Every parameter must be a type node")
						}

						this.parameters = payload.parameters

						if(!Array.isArray(payload.body)) {
							throw new Error("Body must be an array")
						}
						this.body = payload.body

						if(payload.returns.kind !== "type") {
							throw new Error("Return must be a type node.")
						}
						this.returns = payload.returns

						break
					case "obj":
						if(typeof payload.value !== "object") {
							throw new Error("Object value must be an object.")
						}
						this.value = payload.value
						break
					case "type": // type literal node - not a type node!
						if(payload.value.kind !== "type") {
							throw new Error(`Type literal value must be a type node, not ${payload.value.kind}.`)
						}
						this.value = payload.value
						break
					case "list":
						if(!Array.isArray(payload.elements)) {
							throw new Error("List elements must be an array.")
						}
						this.elements = payload.elements
						break
					default:
						throw new Error("Invalid payload type: " + payload.type)
				}
				break
			case "type":
				requiresType = false

				if(payload.deferred) {
					this.deferred = true
					this.origin = "deferred"

					break
				}

				// the "any" value refers to the result when an object is accessed by bracket (string access).
				let builtIns = ["int", "float", "bool", "null", "str", "fn", "obj", "type", "list", "any"]

				if(payload.baseType) {
					if(!builtIns.includes(payload.baseType)) {
						throw new Error(`Type: '${payload.baseType}' is not a built-in type.`)
					}

					if(payload.origin !== "builtin") {
						throw new Error(`Type: '${payload.baseType}' is built-in but was not marked as built-in`)
					}

					this.baseType = payload.baseType
				} else {
					if(!(payload.name)) {
						throw new Error("A type node must have either type or name set.")
					}

					if(builtIns.includes(payload.name)) {
						throw new Error(`Type: '${payload.name}' is a built-in type and is not valid as a named type.`)
					}

					if(payload.origin !== "named") {
						throw new Error(`Type: '${payload.name}' is a named type but was not marked as named`)
					}

					this.name = payload.name
				}

				this.origin = payload.origin

				if(payload.baseType === "list") {
					if(payload.contains.kind !== "type") {
						throw new Error("List type must contain a type node.")
					}

					this.contains = payload.contains
				}

				if(payload.baseType === "fn") {
					if(!Array.isArray(payload.parameters)) {
						throw new Error("Parameters list must be an array.")
					}

					if(!payload.parameters.every((node, i) => {
							return node.kind === "type"
						})) {
						throw new Error("Every parameter entry must be a type node.")
					}

					this.parameters = payload.parameters

					if(payload.returns.kind !== "type") {
						throw new Error("Return must be a type node.")
					}
					this.returns = payload.returns
				}

				if(payload.baseType === "obj") {
					if(typeof payload.structure !== "object") {
						throw new Error("Object structure must be an object.")
					}

					if(!Object.values(payload.structure).every((node, i) => {
							return node.kind === "type"
						})) {
						throw new Error("Every object entry must be a type node.")
					}

					this.structure = payload.structure
				}

				break
			case "identifier":
				// TODO validate against JS keywords
				if(typeof payload.name !== "string") {
					throw new Error("Identifier name must be a string.")
				}

				this.name = payload.name

				this.type = payload.type

				break
			case "typeof":
				if(typeof payload.target.kind !== "string") {
					throw new Error("'typeof' target must be a Parse Node.")
				}
				this.target = payload.target

				this.type = new ParseNode("type", {baseType: "type", origin: "builtin"})

				break
			case "new":
				if(payload.target.kind !== "type") {
					throw new Error("'new' target must a type node.")
				}
				this.target = payload.target

				this.type = payload.target

				break
			case "let":
				requiresType = false

				if(typeof payload.identifier !== "string") {
					throw new Error("Identifier name must be a string.")
				}
				this.identifier = payload.identifier

				if(typeof payload.value.kind !== "string") {
					throw new Error("'let' target value must be a Parse Node.")
				}
				this.value = payload.value

				break
			case "if":
				requiresType = false

				if(typeof payload.condition.kind !== "string") {
					throw new Error("'if' condition must be a Parse Node.")
				}
				this.condition = payload.condition

				if(!Array.isArray(payload.body)) {
					throw new Error("'if' body must be an array.")
				}

				if(!payload.body.every((node, i) => {
						return typeof node.kind === "string"
					})) {
					throw new Error("Every member of the 'if' body must be a Parse Node.")
				}
				this.body = payload.body

				if(payload.else) {
					if(!Array.isArray(payload.else)) {
						throw new Error("'else' body must be an array.")
					}

					if(!payload.else.every((node, i) => {
							return typeof node.kind === "string"
						})) {
						throw new Error("Every member of the 'else' body must be a Parse Node.")
					}

					this.else = payload.else
				}

				break
			case "while":
				requiresType = false

				if(typeof payload.condition !== "object") {
					throw new Error("'while' condition must be a Parse Node.")
				}
				this.condition = payload.condition

				if(!Array.isArray(payload.body)) {
					throw new Error("'while' body must be an array.")
				}

				if(!payload.body.every((node, i) => {
						return typeof node.kind === "string"
					})) {
					throw new Error("Every member of the 'while' body must be a Parse Node.")
				}

				this.body = payload.body

				break
			case "return":
				requiresType = false

				if(typeof payload.value.kind !== "string") {
					throw new Error("return value must be a Parse Node.")
				}

				this.value = payload.value

				break
			case "as":
				if(typeof payload.from.kind !== "string") {
					throw new Error("'as' left-hand side must be a Parse Node.")
				}
				this.from = payload.from

				if(payload.to.kind !== "type") {
					throw new Error("'as' right-hand side must be a type node.")
				}

				this.to = payload.to

				this.type = payload.to

				break
			case "call":
				if(!Array.isArray(payload.arguments)) {
					throw new Error("Function call arguments must be an array.")
				}
				this.arguments = payload.arguments

				if(typeof payload.target.kind !== "string") {
					throw new Error("Function call target must be a Parse Node.")
				}

				this.target = payload.target

				// we need a deferred node here if payload.target is itself a deferred node, it will have no return value.
				if((typeof this.target.type.returns !== "object")) {
					// fill in placeholder
					this.target.type.returns = new ParseNode("type", {deferred: true})
				}
				this.type = this.target.type.returns

				break
			case "access":
				if(!["dot", "bracket"].includes(payload.method)) {
					throw new Error("Access method must be dot or bracket")
				}

				if(payload.method === "dot" && (typeof payload.index !== "string")) {
					throw new Error("Object access index must be a string.")
				}

				if(payload.method === "bracket" && (typeof payload.index !== "object")) {
					throw new Error("Access index must be a parse node.")
				}

				this.method = payload.method

				if(payload.target.constructor !== this.constructor) {
					throw new Error("Access target must be a Parse Node.")
				}

				this.target = payload.target

				this.index = payload.index

				if(this.method === "dot") {
					if(!this.target.type.deferred && this.target.type.baseType !== "obj") {
						throw new Error("Only objects may be accessed with the dot operator.")
					}

					// if the target itself is deferred, we need to give it a structure element
					// acting under the assumption that it is indeed an object
					if(this.target.type.deferred && !(this.target.type.structure)) {
						this.target.type.structure = {}
					}


					// fill in placeholder for access of unavailable values (i.e. coming from "this")
					if((typeof this.target.type.structure[this.index]) !== "object") {
						this.target.type.structure[this.index] = new ParseNode("type", {deferred: true})
					}

					this.type = this.target.type.structure[this.index]
				} else if(this.method === "bracket") {
					if(this.target.type.baseType === "list") {
						this.type = this.target.type.contains
					}

					/*
					 else if(this.target.type.baseType === "map") {
						this.type = this.target.type.keys
					}
					*/
					else {
						this.type = new ParseNode("type", {baseType: "any", origin: "builtin"})
					}
				}

				break
			case "this":
				this.type = payload.type
				break
			default:
				throw new Error("Invalid node kind: " + kind)
		}

		// all ParseNodes must contain a type ParseNode, except for type ParseNodes themselves.
		if(requiresType && ((typeof this.type !== "object") || this.type.kind !== "type")) {
			throw new Error(`Parse Node must contain a type. (${this.kind})`)
		}
	}
}

module.exports = ParseNode