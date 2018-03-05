const t = require("./util").test

describe("Binary operations", () => {
	describe("Arithmetic", () => {
		t("Addition", `let a = 1 + 2`)
		t("Subtraction", `let a = 1 - 2`)
		t("Multiplication", `let a = 1 * 2`)
		t("Division", `let a = 1 / 2`)
		t("Modulo", `let a = 1 % 2`)
	})

	describe("Comparison", () => {
		t("Less than", `let a = 1 < 2`)
		t("Greater than", `let a = 1 > 2`)
		t("Less than or equal to", `let a = 1 <= 2`)
		t("Greater than or equal to", `let a = 1 >= 2`)
		t("Equals", `let a = 1 == 2`)
		t("Not equals", `let a = 1 != 2`)
	})

	describe("Assignment", () => {
		t("Addition assignment", `let a = 1; a += 2`)
		t("Subtraction assignment", `let a = 1; a -= 2`)
		t("Multiplication assignment", `let a = 1; a *= 2`)
		t("Division assignment", `let a = 1; a /= 2`)
		t("Modulo assignment", `let a = 1; a %= 2`)
	})

	describe("Boolean", () => {
		t("And", `let a = true && false`)
		t("Or", `let a = true || false`)
	})

	describe("Operator precedence", () => {
		t("multiply before addition", `let a = 2 + 3 * 4`)
		t("parentheses", `let a = (2 + 3) * 4`)
	})

	describe("String concatenation", () => {
		t("Concatenate", `let a = "asdf" + "zxcv"`)
	})
})

