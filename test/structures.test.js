const t = require("./util").test

describe("Builtin data structures", () => {
	describe("Lists", () => {
		describe("Literals", () => {
		})

		t("List access", `
let myList = [1, 2, 3, 4]
let r = myList[1]
`)
		t("List insertion", "", {skip: true})
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
		})

		// TODO test error: access that does not exist
	})
})