// include in every compiled Kythera file
const KYTHERA = {}
KYTHERA.type = class {
	constructor(type, structure = null, name = null) {
		this.type = type

		if(name !== null) {
			this.name = name
		}

		/*
		We have to re-validate type object structure here because they could come
		not just from the compiler but also from the FFI.
		 */
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

			}

			this.structure = structure
		}
	}

	// create a new KYTHERA.value of this type
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
			case "type":
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

	static eq(a, b) {
		if (a.type !== b.type) {
			return false
		}

		if (a.type === "fn") {
			if(!this.eq(a.structure.returns, b.structure.returns)) {
				return false
			}

			if(a.structure.parameters.length !== b.structure.parameters.length) {
				return false
			}

			for(let i = 0; i < a.structure.parameters.length; i += 1) {
				if (!this.eq(a.structure.parameters[i], b.structure.parameters[i])) {
					return false
				}
			}
			return true
		}

		if (b.type === "obj") {
			if (Object.keys(a.structure).length !== Object.keys(b.structure).length) {
				return false
			}

			return Object.keys(this.structure).every((key, i) => this.eq(a.structure[key], b.structure[key]));
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
		this.value = value
	}

	// TODO this definitely does not check functions and objects correctly
	eq(other) {
		return this.value === other.value && KYTHERA.type.eq(this.type, other.type)
	}
}


module.exports = KYTHERA