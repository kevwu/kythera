require("jest")
const util = require("./util")

let i = 0

afterEach(() => {
	i += 1
})

describe("Primitive Types", () => {
	let program = util.parseFile("test/primitives.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	describe("'new'", () => {
		t("bool")
		t("int")
		t("float")
		t("str")
		t("null")
	})

	describe("Literals", () => {
		t("true")
		t("false")
		t("int")
		t("float")
		t("str")
		t("null")
	})

	describe("Arithmetic", () => {
		t("int Addition")
		t("float addition")
		t("subtraction")
		t("division")
		t("multiplication")
		t("modulo")

		describe("Operator precedence", () => {
			t("multiply before addition")
			t("parentheses")
		})
	})

	describe("Boolean operations", () => {
		t("negate false")
		t("negate true")
		t("and")
		t("and")
		t("short-circuit and")
		t("or")
		t("or")
		t("short-circuit or")
	})

	describe("typeof", () => {
		t("true")
		t("false")
		t("int")
		t("float")
		t("str")
		t("null")
	})

	describe("Casting", () => {
		describe("ints and floats", () => {
			t("int as float")
			t("float as int")
		})

		describe("ints and floats to bool", () => {
			t("1.0 as bool")
			t("0.0 as bool")
			t("1 as bool")
			t("0 as bool")
		})
	})
})