require("jest")

const util = require("./util")

let i = 0

afterEach(() => {
	i += 1
})

describe("Type casting", () => {
	let program = util.parseFile("test/casting.ky")
	i = 0

	let t = (name) => {
		test(name, () => expect(program[i]).toMatchSnapshot())
	}
})