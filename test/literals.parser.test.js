require("jest")
const util = require("./util")

let i = 0

afterEach(() => {
	i += 1
})

describe("Literals", () => {
	let program = util.parseFile("test/literals.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	describe("int", () => {
		t("literal")
		t("typeof")
	})

	describe("float", () => {
		t("literal")
		t("typeof")
	})

	describe("null", () => {
		t("literal")
		t("typeof")
	})

	describe("obj", () => {
		t("literal")
		t("typeof")
	})

	describe("Arithmetic binary", () => {
		t("Adding ints")
		t("Adding floats")
		t("Subtract")
		t("Divide")
		t("Modulo")

		t("Operator precedence")
		t("Operator precedence with parens")
	})

	describe("Boolean unary", () => {
		t("Negate false")
		t("Negate true")
	})

	describe("Boolean binary", () => {
		t("And")
		t("And")

		t("Or")
		t("Or")
	})

	describe("Type literals", () => {
		t("int")
		t("float")
		t("str")
		t("fn (with params)")
		t("fn (no params)")
		t("obj (structured)")
		t("obj (freeform)")
	})
})