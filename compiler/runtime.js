// include in every compiled Kythera file
const KYTHERA = {}
KYTHERA.type = class {
	constructor(type, structure = null) {
		if(typeof type !== "string") {
			throw new Error("type parameter must be a string.")
		}
		this.baseType = type

		if(type === "fn" || type === "obj" || type === "list") {
			if(structure === null) {
				throw new Error(`Cannot initialize ${type} without structure.`)
			}

			if(type === "fn") {
				if(!Array.isArray(structure.parameters)) {
					throw new Error("Function parameter list must be an array.")
				}

				if(!structure.parameters.every((param, i) => {
					return (param.constructor === this.constructor) || param.derived
					})) {
					throw new Error("Every function parameter must be a type.")
				}

				if((structure.returns.constructor !== this.constructor) && !(structure.returns.derived)) {
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
		switch(this.baseType) {
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
			case "any":
				throw new Error("Cannot instantiate from 'any' type, cast to another type first.")
			default:
				throw new Error("Invalid type: " + this.baseType)
		}
	}

	// compare the types of two values
	static typeEq(a, b) {
		if(a.baseType !== b.baseType) {
			return false
		}

		if(a.baseType === "fn") {
			if(!this.typeEq(a.structure.returns, b.structure.returns)) {
				return false
			}

			if(a.structure.parameters.length !== b.structure.parameters.length) {
				return false
			}

			for(let i = 0; i < a.structure.parameters.length; i += 1) {
				if(!this.typeEq(a.structure.parameters[i], b.structure.parameters[i])) {
					return false
				}
			}
			return true
		}

		if(a.baseType === "obj") {
			if(Object.keys(a.structure).length !== Object.keys(b.structure).length) {
				return false
			}

			const aContainsAllb = Object.keys(a.structure).every((key, i) => this.typeEq(a.structure[key], b.structure[key]));
			const bContainsAlla = Object.keys(b.structure).every((key, i) => this.typeEq(a.structure[key], b.structure[key]));

			return aContainsAllb && bContainsAlla
		}

		if(a.baseType === "list") {
			return this.typeEq(a.contains.typeEq(b.contains))
		}

		return true
	}
}

// types with no need for structure. These are always the same, so we can instantiate them once and reuse them.
KYTHERA.type.PRIMITIVES = {
	bool: new KYTHERA.type("bool"),
	int: new KYTHERA.type("int"),
	float: new KYTHERA.type("float"),
	str: new KYTHERA.type("str"),
	"null": new KYTHERA.type("null"),
	type: new KYTHERA.type("type"),
}

KYTHERA.value = class {
	constructor(value, type) {
		if(!(type instanceof KYTHERA.type) && !(type.derived)) {
			throw new Error("Value type must be a KYTHERA.type.")
		}
		this.type = type

		// this switch block is near-verbatim from ParseNode, but I believe it still needs to exist independently here.
		// it may be executed in places where ParseNode does not (e.g. in the runtime).
		switch(this.type.baseType) {
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
			case "list":
				if(!Array.isArray(value)) {
					throw new Error("list value must be an array.")
				}
				this.value = value

				// TODO type check list elements

				break
			case "type": // type literal node - not a type node!
				if(!(value instanceof KYTHERA.type) && !(value.derived)) {
					throw new Error('type value must be a KYTHERA.type.')
				}
				this.value = value
				break
			default:
				throw new Error("Invalid payload type: " + type)
		}
	}
}

// reusable literals
KYTHERA.LITERALS = {
	"true": new KYTHERA.value(true, KYTHERA.type.PRIMITIVES.bool),
	"false": new KYTHERA.value(false, KYTHERA.type.PRIMITIVES.bool),
	"null": new KYTHERA.value(null, KYTHERA.type.PRIMITIVES.null)
}

// convenience function, converts raw JS boolean into Kythera boolean value
const kytheraBool = (val) => val ? KYTHERA.LITERALS.true : KYTHERA.LITERALS.false


KYTHERA.value.eq = (a, b) => {
	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		return KYTHERA.LITERALS.false
	}

	if(["bool", "int", "float", "str", "null"].includes(a.type.baseType)) {
		return kytheraBool(a.value === b.value)
	}

	if(a.type.baseType === "obj") {
		// TODO compare each object member
	}

	if(a.type.baseType === "fn") {
		// TODO compare memory addresses for now
		return this.value === b.value
	}

	if(a.type.baseType === "list") {
		// TODO compare each list member
		this.value.every()
	}

	if(a.type.baseType === "type") {
		return kytheraBool(KYTHERA.type.typeEq(a.value, b.value))
	}
}

KYTHERA.value.ne = (a, b) => {
	return kytheraBool(!(KYTHERA.value.eq(a,b).value))
}

KYTHERA.value.lt = (a, b) => {
	if(a.type.baseType !== "int" && a.type.baseType !== "float") {
		throw new Error("Comparison requires int or float (the compiler should have caught this")
	}

	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		throw new Error("Types do not match (the compiler should have caught this")
	}

	return kytheraBool(a.value < b.value)
}

KYTHERA.value.gt = (a, b) => {
	if(a.type.baseType !== "int" && a.type.baseType !== "float") {
		throw new Error("Comparison requires int or float (the compiler should have caught this")
	}

	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		throw new Error("Types do not match (the compiler should have caught this")
	}

	return kytheraBool(a.value > b.value)
}

KYTHERA.value.le = (a, b) => {
	return kytheraBool(!(KYTHERA.value.gt(a,b).value))
}

KYTHERA.value.ge = (a, b) => {
	return kytheraBool(!(KYTHERA.value.lt(a,b).value))
}

KYTHERA.value.add = (a, b) => {
	if(a.type.baseType !== "int" && a.type.baseType !== "float" && a.type.baseType !== "str") {
		throw new Error("Arithmetic requires int or float (the compiler should have caught this")
	}

	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		throw new Error("Types do not match (the compiler should have caught this")
	}

	return new KYTHERA.value((a.value + b.value), a.type)
}

KYTHERA.value.sub = (a, b) => {
	if(a.type.baseType !== "int" && a.type.baseType !== "float") {
		throw new Error("Arithmetic requires int or float (the compiler should have caught this")
	}

	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		throw new Error("Types do not match (the compiler should have caught this")
	}

	return new KYTHERA.value((a.value - b.value), a.type)
}

KYTHERA.value.mul = (a, b) => {
	if(a.type.baseType !== "int" && a.type.baseType !== "float") {
		throw new Error("Arithmetic requires int or float (the compiler should have caught this")
	}

	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		throw new Error("Types do not match (the compiler should have caught this")
	}

	return new KYTHERA.value((a.value * b.value), a.type)
}

KYTHERA.value.div = (a, b) => {
	if(a.type.baseType !== "int" && a.type.baseType !== "float") {
		throw new Error("Arithmetic requires int or float (the compiler should have caught this")
	}

	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		throw new Error("Types do not match (the compiler should have caught this")
	}

	let result
	if(a.type.baseType === "int") {
		result = Math.floor(a.value / b.value)
	} else {
		result = a.value / b.value
	}

	return new KYTHERA.value(result , a.type)
}

KYTHERA.value.mod = (a, b) => {
	if(a.type.baseType !== "int" && a.type.baseType !== "float") {
		throw new Error("Arithmetic requires int or float (the compiler should have caught this")
	}

	if(!KYTHERA.type.typeEq(a.type, b.type)) {
		throw new Error("Types do not match (the compiler should have caught this")
	}

	return new KYTHERA.value((a.value % b.value), a.type)
}

KYTHERA.value.and = (a, b) => {
	if(!(a.type.baseType === "bool" && b.type.baseType === "bool")) {
		throw new Error("Non-boolean types used for boolean operation (the compiler should have caught this)")
	}

	return kytheraBool(a.value && b.value)
}

KYTHERA.value.or = (a, b) => {
	if(!(a.type.baseType === "bool" && b.type.baseType === "bool")) {
		throw new Error("Non-boolean types used for boolean operation (the compiler should have caught this)")
	}

	return kytheraBool(a.value || b.value)
}

KYTHERA.value.not = (a) => {
	if(!(a.type.baseType === "bool")) {
		throw new Error("Not operator requires boolean (the compiler should have caught this)")
	}

	return kytheraBool(!a.value)
}

KYTHERA.value.as = (srcVal, destType) => {
	if(!KYTHERA.value.castable(srcVal.type, destType)) {
		throw new Error(`Cannot cast ${srcVal.type.baseType} to ${destType.baseType}`)
	}

	switch(srcVal.type.baseType) {
		case "bool":
			switch(destType.baseType) {
				case "int":
					if(srcVal.value) {
						return new KYTHERA.value(1, KYTHERA.type.PRIMITIVES.int)
					} else {
						return new KYTHERA.value(0, KYTHERA.type.PRIMITIVES.int)
					}
				case "float":
					if(srcVal.value) {
						return new KYTHERA.value(1.0, KYTHERA.type.PRIMITIVES.float)
					} else {
						return new KYTHERA.value(0.0, KYTHERA.type.PRIMITIVES.float)
					}
				case "str":
					return new KYTHERA.value(srcVal.value, KYTHERA.type.PRIMITIVES.bool)
				default:
					throw new Error("Cannot cast bool to " + destType.baseType)
			}
		case "int":
			switch(destType.baseType) {
				case "bool":
					return new KYTHERA.value((srcVal !== 0), KYTHERA.type.PRIMITIVES.bool)
				case "float":
					return new KYTHERA.value(srcVal.value, KYTHERA.type.PRIMITIVES.float)
				case "str":
					return new KYTHERA.value(`${srcVal.value}`, KYTHERA.type.PRIMITIVES.str)
				default:
					throw new Error("Cannot cast int to " + destType.baseType)
			}
		case "float":
			switch(destType.baseType) {
				case "bool":
					return new KYTHERA.value((srcVal.value !== 0.0), KYTHERA.type.PRIMITIVES.bool)
				case "int":
					return new KYTHERA.value(parseInt(srcVal.value), KYTHERA.type.PRIMITIVES.int)
				case "str":
					return new KYTHERA.value(`${srcVal.value}`, KYTHERA.type.PRIMITIVES.str)
				default:
					throw new Error("Cannot cast float to " + destType.baseType)
			}
		case "str":
			switch(destType.baseType) {
				case "str":
					return new KYTHERA.value(srcVal.value, KYTHERA.type.PRIMITIVES.str)
				default:
					throw new Error("Cannot cast str to " + destType.baseType)
			}
		case "null":
			switch(destType.baseType) {
				case "str":
					return new KYTHERA.value("null", KYTHERA.type.PRIMITIVES.str)
				default:
					throw new Error("Cannot cast null to " + destType.baseType)
			}
		case "fn":
			switch(destType.baseType) {
				case "str":
					const paramTypeString = srcVal.type.structure.parameters.map((paramType, i) => {
						const paramVal = new KYTHERA.value(paramType, KYTHERA.type.PRIMITIVES.type)
						return KYTHERA.value.as(paramVal, KYTHERA.type.PRIMITIVES.str).value
					}).reduce((prev, curr) => {
						return prev + curr + ","
					}, "")

					const returnTypeString = KYTHERA.value.as(new KYTHERA.value(srcVal.type.structure.returns, KYTHERA.type.PRIMITIVES.type), KYTHERA.type.PRIMITIVES.str)
					return new KYTHERA.value(`<${paramTypeString}> ${returnTypeString.value}`, KYTHERA.type.PRIMITIVES.str)
				default:
					throw new Error("Cannot cast fn to " + destType.baseType)
			}
		case "type":
			switch(destType.baseType) {
				case "str":
					let out = srcVal.value.baseType

					if(out === "fn") {
						out += '<'

						out += srcVal.value.structure.parameters.map((paramType, i) => {
							const paramVal = new KYTHERA.value(paramType, KYTHERA.type.PRIMITIVES.type)
							return KYTHERA.value.as(paramVal, KYTHERA.type.PRIMITIVES.str).value
						}).reduce((prev, curr) => {
							return prev + curr + ","
						}, "")

						out += `> ${KYTHERA.value.as(new KYTHERA.value(srcVal.value.structure.returns, KYTHERA.type.PRIMITIVES.type), KYTHERA.type.PRIMITIVES.str).value}`
					} else if(out === "obj") {
						out += '{\n'

						out += Object.entries(srcVal.value.structure).map(([key, type]) => {
							const entryTypeVal = new KYTHERA.value(type, KYTHERA.type.PRIMITIVES.type)

							return `${KYTHERA.value.as(entryTypeVal, KYTHERA.type.PRIMITIVES.str).value} ${key}`
						}).reduce((prev, curr) => {
							return prev + curr + ',\n'
						}, "")

						out += '}'

					} else if(out === "list") {
						// TODO list syntax subject to change
						out += `[${srcVal.value.structure.contains}]`
					}

					return new KYTHERA.value(out, KYTHERA.type.PRIMITIVES.str)
				default:
					throw new Error("Cannot cast type to: " + destType.baseType)
			}
		case "obj":
			switch(destType.baseType) {
				case "obj":
					throw new Error("Object casting not yet implemented")
				case "str":
					let out = '{\n'

					out += Object.entries(srcVal.value).map(([key, val]) => {
						return `${key} = ${KYTHERA.value.as(val, KYTHERA.type.PRIMITIVES.str).value}`
					}).reduce((prev, curr) => {
						return prev + curr + ",\n"
					}, "")

					out += '}'

					return new KYTHERA.value(out, KYTHERA.type.PRIMITIVES.str)
				default:
					throw new Error("Cannot cast obj to " + destType.baseType)
			}
		case "list":
			throw new Error("List casting not yet implemented")
		default:
			throw new Error("Invalid input type: " + srcVal.type.baseType)
	}
}

// TODO make this accessible as a language feature as well
KYTHERA.value.castable = (srcType, destType) => ({
		"bool": ["int", "float", "str"],
		"int": ["bool", "float", "str"],
		"float": ["bool", "int", "str"],
		// "str": ["list[str]"]
		"str": ["str"],
		"null": ["str"],
		"fn": ["str"],
		"obj": ["obj", "str"],
		"list": ["str"],
		"type": ["str"]
	}[srcType.baseType].includes(destType.baseType))

module.exports = KYTHERA