require("jest")
const common = require("./common")

let i = 0

afterEach(() => {
	i += 1
})

describe("Types", () => {
	let program = common.parseFile("test/vars.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	describe("'new'", () => {
		t("int")
		t("float")
		t("str")
		t("null")
	})

	describe("'name'", () => {
		t("int primitive")
		t("fn type")
		t("obj type")
	})

	describe("'let'", () => {
		t("From int literal")
		t("From 'new'")
		t("From obj literal")
	})

	describe("obj access", () => {
		t("Access")
		t("Access")
	})

	describe("Casting", () => {
		t("Declaration from type cast")
		t("Typeof")
		t("Typeof comparison")
		t("Typeof comparison with nested type cast")
		t("Function using user-defined type")
		t("Function call with type cast")
		t("Function call without type cast")
	})
})