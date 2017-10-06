const KYTHERA = {
	// equality test
	equals: (a,b) => {
		return a.value === b.value && a.type === b.type
	},
	value: class {
		constructor(value, type) {
			this.value = value
			this.type = type
		}
	}
}
