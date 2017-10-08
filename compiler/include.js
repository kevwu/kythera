// include in every compiled Kythera file
const KYTHERA = {
	// equality test
	equals: (a,b) => {
		return a.value === b.value && a.type === b.type
	},
	value: class {
		constructor(type, value) {
			this.value = value
			this.type = type
		}
	}
}

module.exports = KYTHERA