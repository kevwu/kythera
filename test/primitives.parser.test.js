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

	describe("literals", () => {
		t("true")
		t("false")
		t("int")
		t("float")
		t("str")
		t("null")
	})

	describe("casting", () => {
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