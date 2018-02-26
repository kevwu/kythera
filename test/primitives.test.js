const t = require("./util").test

describe("Primitive Types", () => {
	describe("Initialization with 'new'", () => {
		t("bool", `new bool`)
		t("int", `new int`)
		t("float", `new float`)
		t("str", `new str`)
		t("null", `new null`)
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
		t("true", `true`)
		t("false", `false`)
		t("int", `10`)
		t("float", `3.14159`)
		t("str", `"kythera"`)
		t("null", `null`)
	})

	describe("Arithmetic", () => {
		t("int Addition", `2+2`)
		t("float addition", `3.14159 + 2.71828`)
		t("subtraction", `9-5`)
		t("division", `6 / 3`)
		t("multiplication", `4 * 2`)
		t("modulo", `18 % 3`)
	})

	describe("Boolean operations", () => {
		t("negate false", `!false`, {compile: false})
		t("negate true", `!true`, {compile: false})
		t("and", `true && true`)
		t("and", `true && false`)
		t("short-circuit and", `false && true`)
		t("or", `false || false`)
		t("or", `false || true`)
		t("short-circuit or", `true || false`)
	})

	describe("typeof", () => {
		t("true", `typeof true`)
		t("false", `typeof false`)
		t("int", `typeof 10`)
		t("float", `typeof 3.14159`)
		t("str", `typeof "kythera"`)
		t("null", `typeof null`)
	})

	describe("Casting", () => {
		describe("ints and floats", () => {
			t("int as float", `10 as float`, {compile: false})
			t("float as int", `3.14159 as int`, {compile: false})
		})

		describe("ints and floats to bool", () => {
			t("1.0 as bool", `1.0 as bool`, {compile: false})
			t("0.0 as bool", `0.0 as bool`, {compile: false})
			t("1 as bool", `1 as bool`, {compile: false})
			t("0 as bool", `0 as bool`, {compile: false})
		})
	})
})