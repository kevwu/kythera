const t = require("./util").test

describe("Types", () => {
	describe("Derived types", () => {
		t("Basic usage", `
let price = int
let a = new price
		`)

		t("Object type", `
let myDataType = obj{
	int a,
	str b,
}

let myVal = new myDataType

let out1 = typeof myVal
		`)

		t("Conditional type", `
let randomTF = <> bool {
	return false
}

let myOriginType = new type

if randomTF() {
	myOriginType = int
} else {
	myOriginType = str
}

let myVal = new myOriginType
		`)

		t("Use parameter type value as return type", `
let myGenericFn = <type T> T {
	let a = new T
	return a
}

myGenericFn(int)
		`, {skip: true})
	})
})

