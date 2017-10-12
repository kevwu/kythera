// include in every compiled Kythera file
const KYTHERA = {
	// equality test
	equals: (a,b) => {
		// TODO test structural equality
		return a.value === b.value && a.type === b.type
	},
	value: class {
		constructor(type, value, structure = null) {
			this.value = value
			this.type = type

			if(type === "fn" || type === "obj") {
				if(structure === null) {
					throw new Error(`Cannot initialize ${type} without structure.`)
				} else {
					this.structure = structure
				}
			}
		}
	}
}

module.exports = KYTHERA