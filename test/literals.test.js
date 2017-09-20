require("jest")
const common = require("./common")

let i = 0

afterEach(() => {
	i += 1
})

describe("Literals", () => {
	let program = common.parseFile("test/literals.ky")
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
})