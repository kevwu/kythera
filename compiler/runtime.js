// include in every compiled Kythera file
const KYTHERA = {
	value: class {
		constructor(value, type) {
			this.type = type
			this.value = value
		}
		
		// TODO this definitely does not check functions and objects correctly
		eq(other) {
			return this.value === other.value && this.type.eq(other.type)
		}
	},
	type: class {
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

					// ideally, we'd like to do `instanceof KYTHERA.type` but that's not defined yet...
					if(typeof structure.returns !== "object") {
						throw new Error("Function return value must be a KYTHERA.value.")
					}
				}

				if(type === "obj") {

				}

				if(type === "list") {

				}

				this.structure = structure
			}
		}

		eq(other) {
			if (this.type !== other.type) {
				return false
			}

			if (this.type === "fn") {
				if (!this.eq(this.structure.returns, other.structure.returns)) {
					return false
				}

				if (this.structure.parameters.length !== other.structure.parameters.length) {
					return false
				}

				for (let i = 0; i < this.structure.parameters.length; i += 1) {
					if (!this.eq(this.structure.parameters[i], other.structure.parameters[i])) {
						return false
					}
				}
				return true
			}

			if (this.type === "obj") {
				if (Object.keys(this.structure).length !== Object.keys(other.structure).length) {
					return false
				}

				return !Object.keys(this.structure).every((key, i) => this.eqNodeType(this.structure[key], other.structure[key]));
			}
			return true
		}
	}
}

// types with no need for structure
KYTHERA.type.PRIMITIVES = {
	int: new KYTHERA.type("int"),
	float: new KYTHERA.type("float"),
	bool: new KYTHERA.type("bool"),
	"null": new KYTHERA.type("null"),
	str: new KYTHERA.type("str"),
	type: new KYTHERA.type("type"),
}

module.exports = KYTHERA