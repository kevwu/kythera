require("jest")
const common = require("./common")

let i = 0

afterEach(() => {
	i += 1
})

describe("Lists", () => {
	let program = common.parseFile("parser/test/lists.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	t("Initialization with 'let'")
	t("Access")
	t("Creation of custom type (irrelvant)")
	// i += 1
	t("Initialization with custom type")
	t("Initialization from object list literal")
	t("Function returning list")
	t("Access from function call result")
})