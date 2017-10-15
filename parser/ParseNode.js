const VALID_NODE_KINDS = " unary binary literal type identifier typeof new let if while return as call access objAccess "

class ParseNode {
	constructor(kind, payload) {
		this.kind = kind

		// Internal sanity check: validate node kind and structure
		switch(kind) {
			case "unary":
				// only one unary operator right now
				if(payload.operator !== "!") {
					throw new Error("Invalid unary operator: " + payload.operator)
				}
				this.operator = payload.operator

				// TODO can we do deeper validation on the value? Finding type, etc
				if(!(typeof payload.target === "object")) {
					throw new Error("Missing unary target.")
				}

				this.target = payload.target
				break
			case "binary":
				if(!["==", "<=", ">=", ">", "<", "+", "-", "*", "/", "%", "||", "&&"].includes(payload.operator)) {
					throw new Error("Invalid operator: " + payload.operator)
				}
				this.operator = payload.operator

				if(!(typeof payload.left === "object")) {
					throw new Error("Missing left-hand side value.")
				}
				this.left = payload.left

				if(!(typeof payload.right === "object")) {
					throw new Error("Missing right-hand side value.")
				}
				this.right = payload.right
				break
			case "assign":
				// TODO remove this requirement?
				if(payload.operator !== "=") {
					throw new Error("Assign must use the '=' operator.")
				}
				this.operator = payload.operator

				if(!(typeof payload.left === "object")) {
					throw new Error("Missing left-hand side value.")
				}
				this.left = payload.left

				if(!(typeof payload.right === "object")) {
					throw new Error("Missing right-hand side value.")
				}
				this.right = payload.right
				break
			case "literal":
				// all literals are interpreted as primitive types. They can become named types by casting.
				switch(payload.type) {
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
							throw new Error("Type literal value must be a type node.")
						}
						this.value = payload.value
						break
					default:
						throw new Error("Invalid payload type: " + payload.type)
				}
				this.type = payload.type
				break
			case "type":
				const validBuiltin = ["int", "float", "bool", "null", "str", "fn", "obj", "type", "list"].includes(payload.type)

				if(validBuiltin && payload.origin !== "builtin") {
					throw new Error(`${payload.type} is a built-in type, not a named type.`)
				}

				if(!validBuiltin && payload.origin !== "named") {
					throw new Error(`${payload.type} is not a built-in type.`)
				}

				if(validBuiltin) {
					this.type = payload.type
				} else {
					this.name = payload.name
				}

				this.origin = payload.origin

				if(payload.type === "fn") {
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

				if(payload.type === "obj") {
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
			case "list":
				console.log(payload)
				break
			default:
				throw new Error("Invalid node kind: " + kind)
		}
	}
}

module.exports = ParseNode