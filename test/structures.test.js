const t = require("./util").test

describe("Builtin data structures", () => {
	describe("Lists", () => {
		// TODO syntax for list types will be changed soon
/*		t("Initialization and assignment access", `
let myList = new int[]
myList[0] = 10
	`, {compile: false})

		t("Initialization with custom type", `
let myType = obj{
	int a,
	str b,
}

let myTypeList = new myType[]
`, {skip: true})

		t("Initialization from object list literal", `
let myTypeList = new obj{
	int a,
	str b,
}[]
`, {exec: false})

		t("Access function returning list", `
let myListFn = <> int[] {
	let result = new int[]
	result[0] = 10
}

myListFn()[0]
	`, {compile: false})*/

		describe("List literals", () => {
			t("int", `let a = [1, 2, 3, 4]`)
			t("bool", `let a = [true, false]`)
			t("float", `let a = [1.234, 3.14159]`)
			t("str", `let a = ["hello", "world"]`)
			t("null", `let a = [null, null]`)
			t("type", `let a = [int, float, fn<int> null]`)
			t("fn", `let a = [<int a> null {return null}, <int b> null { return null }]`)
			t("obj", `let a = [{a = 0, b = "asdf",}, {a = 3, b = "qwerty",}]`)
		})
	})


	describe("Maps", () => {

	})

	describe("Objects", () => {
		t("Object access", `
let myObj = {
	a = 10,
}

let out = myObj.a
		`)
		t("Object insertion", `
let myObj = {
	a = 10,
}

let out1 = myObj.a

myObj.a = 20

let out2 = myObj.a
		`)
		t("Access variables in outer scope", `
let g = 10
let myObj = {
	a = <> int {
		return g + 10
	},
}
let out = myObj.a()
		`)

		describe("`this` reference", () => {
			t("Use in access assignment", `
let myObj = {
	a = 10,
	c = <> int {
		return 42 + this.a
	},
}

let out1 = myObj.c()

myObj.c = <> int {
	return 42 + this.a + 10
}

let out2 = myObj.c()
			`)
			t("Use `this` on entry defined after usage", `
let myObj = {
	c = <> int {
		return this.a + 10
	},
	a = 5,
}

let out = myObj.c()
			`)
			t("Use returned object",`
let myObj = {
	b = "asdf",
	c = <> int {
		return this.a + 10 + (this.d())()
	},
	d = <> fn<> int {
		return (<> int {
			return 10
		})
	},
	a = 5,
}

let myResult = myObj.c()

myObj.c = <> int {
	return this.a + 45
}

let myResult2 = myObj.c()
			`)

			t("Deferred array", `
let myObj = {
	a = <> int {
		return this.b[0]
	},
	b = [1, 2, 3],
}

let out = myObj.a()
			`)

			t("Deferred object", `
let myObj = {
	a = <> int {
		return this.b.c
	},
	b = {
		c = 10,
	},
}

let out = myObj.a()
			`)
		})

		// TODO test error: access that does not exist
	})
})