require("jest")
const t = require("./util").testOutput

describe("new", () => {
	t("int", "new int")
	t("float", "new float")
	t("bool", "new bool")
	t("str", "new str")
	t("null", "new null")
	t("type", "new type")
	t("fn", 'new fn<int> null')
	t("fn with fn as parameter", 'new fn<fn<> null> null')
	t("obj", `new obj{int a, str b,}`)
})