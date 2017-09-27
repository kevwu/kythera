require("jest")
const common = require("./common")

let i = 0

afterEach(() => {
	i += 1
})

describe("Variables", () => {
	let program = common.parseFile("test/vars.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	describe("Boolean primitive", () => {
		t("Declaration")
		t("Assignment")
	})

	describe("Integer primitive", () => {
		t("Declaration")
		t("Assignment")
	})

	describe("Floating point primitive", () => {
		t("Declaration")
		t("Assignment")
	})

	describe("String", () => {
		t("Declaration")
		t("Assignment")
	})

	describe("null", () => {
		t("Declaration")
		t("Read")
	})

	describe("Function", () => {
		t("Declaration")
	})

	describe("using 'new'", () => {
		t("int")
		t("float")
		t("bool")
		t("str")
		t("fn")
	})
})