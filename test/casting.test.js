const t = require("./util").test

describe("Type casting", () => {
	describe("Custom type assignment", () => {
		t("primitive", `let myIntType = int`)
		t("fn type", `let myFnType = fn<int, str, myIntType> str`)
	})
})