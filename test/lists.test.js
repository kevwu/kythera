const t = require("./util").test

describe("Lists", () => {
	t("Initialization and assignment access", `
let myList = new int[]
myList[0] = 10
	`, {compile: false})

	t("Initialization with custom type", `
let myType = obj{
	int a,
	str b,
}

let myTypeList = new myType[]	
`, {compile: false})

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
	`, {compile: false})

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