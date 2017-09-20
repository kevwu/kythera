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
		t("declaration")
		t("assignment")
	})

	describe("Integer primitive", () => {
		t("declaration")
		t("assignment")
	})

	describe("Floating point primitive", () => {
		t("declaration")
		t("assignment")
	})

	describe("String", () => {
		t("declaration")
		t("assignment")
	})

	describe("null", () => {
		t("declaration")
		t("read")
	})

	describe("Function", () => {
		t("declaration")
	})

	describe("using 'new'", () => {
		t("int")
		t("float")
		t("bool")
		t("str")
	})
})