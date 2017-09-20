require("jest")
const common = require("./common")

let i = 0

afterEach(() => {
	i += 1
})

describe("Function examples", () => {
	let program = common.parseFile("test/vars.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}

	// this could probably stand more specific testing
	t("Anonymous function and call")

	t("Fibonacci")
	t("Fibonacci (call)")

	t("Fizzbuzz and call")
})