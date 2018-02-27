// include in every compiled Kythera file
const KYTHERA = {}
KYTHERA.type = class {
	constructor(type, structure = null, name = null) {
		if(typeof type !== "string") {
			throw new Error("type parameter must be a string.")
		}
		this.type = type

		// named types. TBD
		if(name !== null) {
			this.name = name
		}

		if(type === "fn" || type === "obj" || type === "list") {
			if(structure === null) {
				throw new Error(`Cannot initialize ${type} without structure.`)
			}

			if(type === "fn") {
				if(!Array.isArray(structure.parameters)) {
					throw new Error("Function parameter list must be an array.")
				}

				if(!structure.parameters.every((param, i) => {
					return param.constructor === this.constructor
					})) {
					throw new Error("Every function parameter must be a type.")
				}

				if(structure.returns.constructor !== this.constructor) {
					throw new Error("Function return value must be a type.")
				}
			}

			if(type === "obj") {
				if(typeof structure !== "object") {
					throw new Error("Object structure must be an object.")
				}

				if(!Object.values(structure).every((val, i) => {
					return val.constructor === this.constructor
					})) {
					throw new Error("Every object structure entry must be a type.")
				}
			}

			if(type === "list") {
				if(structure.contains.constructor !== this.constructor) {
					throw new Error("List must contain a type.")
				}
			}

			this.structure = structure
		}
	}

	// create a KYTHERA.value with the "new" keyword
	makeNew() {
		switch(this.type) {
			case "int":
				return new KYTHERA.value(0, this)
			case "float":
				return new KYTHERA.value(0.0, this)
			case "bool":
				return new KYTHERA.value(false, this)
			case "str":
				return new KYTHERA.value("", this)
			case "null":
				return new KYTHERA.value(null, this)
			case "type": // zero value for type is type
				return new KYTHERA.value(KYTHERA.type.PRIMITIVES.type, this)
			case "fn": // zero value for fn is a function with only a return statement for a new instance of the return type
				return new KYTHERA.value(() => {
					return this.structure.returns.makeNew()
				}, this)
			case "obj":
				return new KYTHERA.value(Object.entries(this.structure).reduce((prev, [name, type], i) => {
					prev[name] = type.makeNew()
					return prev
				}, {}), this)
			case "list":
				throw new Error("Not yet implemented")
			default:
				throw new Error("Invalid type: " + this.type)
		}
	}

	// compare the types of two values
	static eq(a, b) {
		if(a.type !== b.type) {
			return false
		}

		if(a.type === "fn") {
			if(!this.eq(a.structure.returns, b.structure.returns)) {
				return false
			}

			if(a.structure.parameters.length !== b.structure.parameters.length) {
				return false
			}

			for(let i = 0; i < a.structure.parameters.length; i += 1) {
				if(!this.eq(a.structure.parameters[i], b.structure.parameters[i])) {
					return false
				}
			}
			return true
		}

		if(a.type === "obj") {
			if(Object.keys(a.structure).length !== Object.keys(b.structure).length) {
				return false
			}

			const aContainsAllb = Object.keys(a.structure).every((key, i) => this.eq(a.structure[key], b.structure[key]));
			const bContainsAlla = Object.keys(b.structure).every((key, i) => this.eq(a.structure[key], b.structure[key]));

			return aContainsAllb && bContainsAlla
		}

		if(a.type === "list") {
			return this.eq(a.contains.eq(b.contains))
		}

		return true
	}
}

// types with no need for structure. These are always the same, so we can instantiate them once and reuse them.
KYTHERA.type.PRIMITIVES = {
	int: new KYTHERA.type("int"),
	float: new KYTHERA.type("float"),
	bool: new KYTHERA.type("bool"),
	"null": new KYTHERA.type("null"),
	str: new KYTHERA.type("str"),
	type: new KYTHERA.type("type"),
}

KYTHERA.value = class {
	constructor(value, type) {
		if(!(type instanceof KYTHERA.type)) {
			throw new Error("Value type must be a KYTHERA.type.")
		}

		this.type = type

		// this switch block is near-verbatim from ParseNode, but I believe it still needs to exist independently here.
		// it may be executed in places where ParseNode does not (e.g. in the runtime).
		// TODO clean ^that^ up, reduce redundancy, or verify that it's necessary.
		switch(this.type.type) {
			case "bool":
				if(typeof value !== "boolean") {
					throw new Error("bool value must be a boolean")
				}
				this.value = value
				break
			case "int":
				if(!(typeof value === "number" && isFinite(value) && (value % 1 === 0))) {
					throw new Error("int value must be an integer.")
				}
				this.value = value
				break
			case "float":
				if(!(typeof value === "number" && isFinite(value))) {
					throw new Error("float value must be a number.")
				}
				this.value = value
				break
			case "str":
				if(typeof value !== "string") {
					throw new Error("str value must be a string.")
				}
				this.value = value
				break
			case "null":
				if(value !== null) {
					throw new Error("null value must be null.")
				}
				this.value = value
				break
			case "fn":
				if(typeof value !== "function") {
					throw new Error("fn value must be a function.")
				}

				// TODO type check return value
				// this requires deeper introspection that we are capable of right now
				// might be checked at compile-time

				this.value = value
				break
			case "obj":
				if(typeof value !== "object") {
					throw new Error("obj value must be an object.")
				}
				this.value = value

				// TODO check object values against type structure
				break
			case "type": // type literal node - not a type node!
				if(!(value instanceof KYTHERA.type)) {
					throw new Error('type value must be a KYTHERA.type.')
				}
				this.value = value
				break
			case "list":
				if(!Array.isArray(value)) {
					throw new Error("list value must be an array.")
				}
				this.elements = value.elements

				// TODO type check list elements

				break
			default:
				throw new Error("Invalid payload type: " + type)
		}
	}

	static eq(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}

		if(["bool", "int", "float", "str", "null"].includes(a.type.type)) {
			return a.value === b.value
		}

		if(a.type.type === "obj") {
			// TODO compare each object member
		}

		if(a.type.type === "fn") {
			// TODO compare memory addresses for now
			return this.value === b.value
		}

		if(a.type.type === "list") {
			// TODO compare each list member
			this.value.every()
		}

		if(a.type.type === "type") {
			return KYTHERA.type.eq(a.value, b.value)
		}
	}

	static ne(a, b) {
		return !(a.eq(b))
	}

	static lt(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}
	}

	static gt(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}
	}

	static le(a, b) {
		return !(a.gt(b))
	}

	static ge(a, b) {
		return !(a.lt(b))
	}

	static add(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}
	}

	static sub(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}
	}

	static mul(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}
	}

	static div(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}
	}

	static mod(a, b) {
		if(!KYTHERA.type.eq(a.type, b.type)) {
			return false
		}
	}

	static and(a, b) {
		if(!(a.type.type === "bool" && b.type.type === "bool")) {
			throw new Error("Non-boolean types used for boolean operation (the compiler should have caught this)")
		}
	}

	static or(a, b) {
		if(!(a.type.type === "bool" && b.type.type === "bool")) {
			throw new Error("Non-boolean types used for boolean operation (the compiler should have caught this)")
		}
	}
}


module.exports = KYTHERA