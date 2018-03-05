const t = require("./util").test

describe("Binary operations", () => {
	describe("Arithmetic", () => {
		t("Addition", `1 + 2`)
		t("Subtraction", `1 - 2`)
		t("Multiplication", `1 * 2`)
		t("Division", `1 / 2`)
		t("Modulo", `1 % 2`)
	})

	describe("Comparison", () => {
		t("Less than", `1 < 2`)
		t("Greater than", `1 > 2`)
		t("Less than or equal to", `1 <= 2`)
		t("Greater than or equal to", `1 >= 2`)
		t("Equals", `1 == 2`)
		t("Not equals", `1 != 2`)
	})

	describe("Assignment", () => {
		t("Addition assignment", `let a = 1; a += 2`)
		t("Subtraction assignment", `let a = 1; a -= 2`)
		t("Multiplication assignment", `let a = 1; a *= 2`)
		t("Division assignment", `let a = 1; a /= 2`)
		t("Modulo assignment", `let a = 1; a %= 2`)
	})

	describe("Boolean", () => {
		t("And", `true && false`)
		t("Or", `true || false`)
	})

	describe("Operator precedence", () => {
		t("multiply before addition", `2 + 3 * 4`)
		t("parentheses", `(2 + 3) * 4`)
	})

	describe("String concatenation", () => {
		t("Concatenate", `"asdf" + "zxcv"`)
	})
})

