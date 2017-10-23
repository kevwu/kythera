require("jest")
const t = require("./run")

describe("Literals", () => {
	t("int", "10")
	t("float", "3.14159")
	t("bool (true)", "true")
	t("bool (false)", "false")
	t("str", `"hello"`)
	t("null", "null")
	t("type", "int")
	t("type (type)", "type")
	t("fn", `
<int a> null {
	a
	return null
}`)
	t("obj", `
	{
		a = 10,
		b = "hello",
	}
	`)
})