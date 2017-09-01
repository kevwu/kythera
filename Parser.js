class Parser {
	constructor(tokenizer) {
		this.tokenizer = tokenizer
		this.program = []

		Parser.PRECEDENCE = {
			"=": 1,
			"||": 2,
			"&&": 3,
			"<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
			"+": 10, "-": 10,
			"*": 20, "/": 20, "%": 20,
		}

		Parser.FALSE = {
			kind: "literal",
			type: "bool",
			value: false
		}

		Parser.TRUE = {
			kind: "literal",
			type: "bool",
			value: true
		}

		// entry point for all parsing operations
		this.parse = () => {
			while(!this.tokenizer.eof()) {
				this.program.push(this.parseStatement())
				this.skipPunc(';')
				console.log("eos")
			}
		}

		// read tokens until semicolon
		this.parseStatement = () => {
			while(!this.confirmPunc(';')) {
				console.log(this.tokenizer.next())
			}
		}

		this.parseExpression = () => {

		}
	}

	// confirm a token without consuming it

	confirmPunc(char) {
		let token = this.tokenizer.peek()
		return token && token.type === "punc" && (!char || token.value === char) && token
	}

	confirmOp(op) {
		let token = this.tokenizer.peek()
		return token && token.type === "op" && (!op || token.value === op) && token
	}

	// confirm and consume a token

	skipPunc(char) {
		if(this.confirmPunc(char)) this.tokenizer.next()
		else this.tokenizer.err("Expecting punctuation: " + char)
	}

	skipKeyword(word) {
		if(this.confirmKeyword(word)) this.tokenizer.next()
		else this.tokenizer.err("Expecting keyword: " + word)
	}

	skipOp(op) {
		if(this.confirmOp(op)) this.tokenizer.next()
		else this.tokenizer.err("Expecting operator: " + op)
	}
}

module.exports = Parser