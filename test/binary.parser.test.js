require("jest")
const util = require("./util")

let i = 0

afterEach(() => {
	i += 1
})

describe("Binary operations", () => {
	let program = util.parseFile("test/binary.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	describe("Arithmetic", () => {
		t("Addition")
		t("Subtraction")
		t("Multiplication")
		t("Division")
		t("Modulo")
	})

	describe("Comparison", () => {
		t("Less than")
		t("Greater than")
		t("Less than or equal to")
		t("Greater than or equal to")
		t("Equals")
		t("Not equals")
	})

	describe("Assignment", () => {
		it("Skip let", () => {})
		t("Addition assignment")
		t("Subtraction assignment")
		t("Multiplication assignment")
		t("Division assignment")
		t("Modulo assignment")
	})

	describe("Boolean", () => {
		t("And")
		t("Or")
	})

	describe("Operator precedence", () => {
		t("multiply before addition")
		t("parentheses")
	})
})