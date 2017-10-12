// this largely comes from the Scope implementation in kevwu/kythera-antlr
class Scope {
	constructor(parent = null, scopeType = "global") {
		// null for top-level scope
		this.parent = parent
		this.symbols = []
		this.scopeType = scopeType
	}

	// initialize variable. Throws error if already declared.
	create(name, type, structure = null) {
		// as long as the name is free in the current scope it can be used.
		if(name in this.symbols) {
			throw new Error(`${name} is already defined.`)
		}

		if((type === "obj" || type === "fn") && structure === null) {
			throw new Error(`Cannot create ${type} without structure.`)
		}

		this.symbols[name] = {
			type: type,
		}
		if(structure !== null) {
			this.symbols[name].structure = structure
		}
	}

	// get type
	get(name) {
		// retrieve in local scope first
		if(name in this.symbols) {
			return this.symbols[name]
		} else { // try parents
			if(this.parent === null) {
				throw new Error(`Undefined variable: ${name}`)
			} else {
				return this.parent.get(name)
			}
		}
	}

	// true if variable accessible from this scope or its parents, false otherwise
	has(name) {
		if(name in this.symbols) {
			return true
		} else {
			if(this.parent === null) {
				return false
			} else {
				return this.parent.has(name)
			}
		}
	}

	// true current scope is within a function
	isInFunction() {
		if(this.scopeType === "function") {
			return true
		}

		if(this.parent === null) {
			return (this.scopeType === "function")
		} else {
			return this.parent.isInFunction()
		}
	}
}

module.exports = Scope