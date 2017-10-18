require("jest")
const common = require("./common")

let i = 0

afterEach(() => {
	i += 1
})

describe("Types", () => {
	let program = common.parseFile("parser/test/controlflow.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	t("if")
	t("if-else")
	t("if-else-if")
	t("if-else with boolean")
	t("if-else-if with boolean")
	t("while")
	i += 1 // skip "let"
	t("while")
})