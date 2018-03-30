const t = require("./util").test

describe("Primitive Types", () => {
	describe("Initialization with 'new'", () => {
		t("bool", `let a = new bool`)
		t("int", `let a = new int`)
		t("float", `let a = new float`)
		t("str", `let a = new str`)
		t("null", `let a = new null`)
	})

	describe("Declaration and assignment", () => {
		t("bool", `
let myBool = false
myBool = true
		`)

		t("int", `
let myInt = 99
myInt = 3
`)
		t("float", `
let myFloat = 3.14159
myFloat = 2.71828183
`)
		t("str", `
let myStr = "hello"
myStr = "world"
		`)

		t("null", `
let myNull = null
myNull = null
	`)
	})

	describe("Literals", () => {
		t("true", `let a = true`)
		t("false", `let a = false`)
		t("int", `let a = 10`)
		t("float", `let a = 3.14159`)
		t("str", `let a = "kythera"`)
		t("null", `let a = null`)
	})

	describe("Arithmetic", () => {
		t("int Addition", `let a = 2+2`)
		t("float addition", `let a = 3.14159 + 2.71828`)
		t("subtraction", `let a = 9 - 5`)
		t("division", `let a = 6 / 3`)
		t("multiplication", `let a = 4 * 2`)
		t("modulo", `let a = 18 % 3`)
	})

	describe("Boolean operations", () => {
		t("negate false", `let a = !false`, {compile: false})
		t("negate true", `let a = !true`, {compile: false})
		t("and", `let a = true && true`)
		t("and", `let a = true && false`)
		t("short-circuit and", `let a = false && true`)
		t("or", `let a = false || false`)
		t("or", `let a = false || true`)
		t("short-circuit or", `let a = true || false`)
	})

	describe("typeof", () => {
		t("true", `let a = typeof true`)
		t("false", `let a = typeof false`)
		t("int", `let a = typeof 10`)
		t("float", `let a = typeof 3.14159`)
		t("str", `let a = typeof "kythera"`)
		t("null", `let a = typeof null`)

		t("typeof comparison", `let a = (typeof 10) == (typeof 20)`)
		t("typeof comparison", `let a = (typeof 10) == (typeof "10")`)
	})

	describe("Casting", () => {
		describe("ints and floats", () => {
			t("int as float", `let a = 10 as float`, {compile: false})
			t("float as int", `let a = 3.14159 as int`, {compile: false})
		})

		describe("ints and floats to bool", () => {
			t("1.0 as bool", `let a = 1.0 as bool`, {compile: false})
			t("0.0 as bool", `let a = 0.0 as bool`, {compile: false})
			t("1 as bool", `let a = 1 as bool`, {compile: false})
			t("0 as bool", `let a = 0 as bool`, {compile: false})
		})
	})
})