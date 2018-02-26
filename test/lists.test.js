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
`)

	t("Access function returning list", `
let myListFn = <> int[] {
	let result = new int[]
	result[0] = 10
}

myListFn()[0]
	`, {compile: false})

	describe("List literals", () => {
		t("int", `[1, 2, 3, 4]`)
		t("bool", `[true, false]`)
		t("float", `[1.234, 3.14159]`)
		t("str", `["hello", "world"]`)
		t("null", `[null, null]`)
		t("type", `[int, float, fn<int> null]`)
		t("fn", `[<int a> null {return null}, <int b> null { return null }]`)
		t("obj", `[{a = 0, b = "asdf",}, {a = 3, b = "qwerty",}]`)
	})
})