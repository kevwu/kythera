class InputStream {
	constructor(input) {
		this.input = input

		this.pos = 0
		this.line = 1
		this.col = 0
	}

	next() {
		let c = this.input.charAt(this.pos)
		this.pos += 1

		if(c === '\n') {
			this.line += 1
			this.col = 0
		} else {
			this.col += 1
		}

		return c

	}

	peek() {
		return this.input.charAt(this.pos)
	}

	eof() {
		return this.peek() === ""
	}

	err(message) {
		throw new Error(`${message} at line ${this.line}, col ${this.col}`)
	}
}

module.exports = InputStream
