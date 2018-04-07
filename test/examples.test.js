/*
Autorun all example files to make sure they're valid Kythera programs.
This test collects evaluation results, but it's not very important what their
values are. The other (actual) tests will check for appropriate behavior.
*/

const t = require("./util").test
const fs = require("fs")

describe("Examples", () => {
	const examples = fs.readdirSync("./examples")
	examples.forEach((file) => {
		const contents = fs.readFileSync(`./examples/${file}`, 'utf8')
		t(file, contents)
	})
})