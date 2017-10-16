// include in every compiled Kythera file
const KYTHERA = {
	value: class {
		constructor(type, value) {
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

			if(type === "fn" || type === "obj") {
				if(structure === null) {
					throw new Error(`Cannot initialize ${type} without structure.`)
				} else {
					// TODO validate incoming structure
					this.structure = structure
				}
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

module.exports = KYTHERA