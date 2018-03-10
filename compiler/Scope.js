// this largely comes from the Scope implementation in kevwu/kythera-antlr
class Scope {
	constructor(parent = null, meta = {type: "global", thisId: null, thisType: null}) {
		// null for top-level scope
		this.parent = parent
		this.symbols = []
		this.meta = meta
	}

	// initialize variable. Throws error if already declared.
	create(name, type) {
		// as long as the name is free in the current scope it can be used.
		if(name in this.symbols) {
			throw new Error(`${name} is already defined.`)
		}

		this.symbols[name] = type
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

	// true if current scope is within a function
	isInFunction() {
		if(this.meta.type === "function") {
			return true
		}

		if(this.parent === null) {
			return (this.meta.type === "function")
		} else {
			return this.parent.isInFunction()
		}
	}

	// if current scope is in a function, get the return type
	getReturnType() {
		if(this.meta.type === "function") {
			return this.meta.returns
		}

		if(this.parent === null) {
			throw new Error("Current scope is not in a function")
		} else {
			return this.parent.getReturnType()
		}
	}

	// 'this' is always accessed from the child of the scope containing the reference.
	getThisType() {
		if(this.parent === null) {
			throw new Error("`this` is not accessible from the global scope.")
		}

		if(this.parent.meta.thisType) {
			return this.parent.meta.thisType
		} else {
			return this.parent.getThisType()
		}
	}

	// 'this' is always accessed from the child of the scope containing the reference.
	// get JS identifier (not Kythera identifier) for current "this" object
	getThisId() {
		if(this.parent === null) {
			throw new Error("`this` is not accessible from the global scope.")
		}

		if(this.parent.meta.thisId) {
			return this.parent.meta.thisId
		} else {
			return this.parent.getThisId()
		}
	}
}

module.exports = Scope