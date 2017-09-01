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
				this.program.push(this.parseExpression())
				this.consumePunc(';')
				console.log(JSON.stringify(this.program, null, 2))
			}
		}

		// all parse functions return the AST subtree for what they encountered.

		this.parseExpression = () => {
			// unwrap parentheses first
			if(this.confirmPunc('(')) {
				this.consumePunc('(')
				let contents = this.parseExpression()
				this.consumePunc(')')

				return contents;
			}

			let nextToken = this.tokenizer.peek()
			console.log("About to handle:")
			console.log(nextToken)

			if(this.confirmPunc('{')) {
				return this.parseObjectLiteral()
			}

			if(this.confirmPunc('[')) {
				return this.parseList()
			}

			if(this.confirmKeyword()) {
				switch(nextToken.value) {
					case "typeof":
						this.consumeKeyword("typeof")
						return {
							kind: "typeof",
							target: this.parseExpression(),
						}
						break
					case "null":
						this.consumeKeyword("null")
						return {
							kind: "literal",
							type: "null",
							value: null,
						}
						break
					case "new":
						this.consumeKeyword("new")

						let typeToken = this.tokenizer.next()
						if(typeToken.type !== "var" && typeToken.type !== "kw") {
							this.tokenizer.inputStream.err("Expected type or type identifier but got " + typeToken.value)
						}

						// this cannot be type-checked yet, there may be user-defined types

						return {
							kind: "new",
							target: typeToken.value
						}
				}
			}

			// literals

			this.tokenizer.next() // consume the token, we won't be dispatching from here
			if(nextToken.type === "num") {
				if(nextToken.type.value % 1 !== 0) { // float
					return {
						kind: "literal",
						type: "float",
						value: nextToken.value,
					}
				} else { // int
					return {
						kind: "literal",
						type: "int",
						value: nextToken.value,
					}
				}
			}
			if(nextToken.type === "str") {
				return {
					kind: "literal",
					type: "str",
					value: nextToken.value,
				}
			}

			// variable
			if(nextToken.type === "var") {
				return {
					kind: "identifier",
					name: nextToken.value,
				}
			}

			this.tokenizer.inputStream.err("Unexpected token: " + JSON.stringify(nextToken))
		}

		// parse a block of statements
		this.parseBlock = () => {
			// return this.delimited('{', '}', ';', this.parseExpression)

			let statements = []

			this.consumePunc('{')

			while(!this.confirmPunc('}')) {
				statements.push(this.parseExpression())
				this.consumePunc(';')
			}

			this.consumePunc('}')

			return statements
		}

		// parse an object literal
		this.parseObjectLiteral = () => {
			let contents = {}

			this.consumePunc('{')

			while(!this.confirmPunc('}')) {
				let nextToken = this.tokenizer.next()
				let newEntry = {}

				if(nextToken.type !== "var") {
					this.tokenizer.inputStream.err("Expected identifier, got " + JSON.stringify(nextToken))
					return
				}

				let entryKey = nextToken.value

				this.consumeOp('=')

				let entryValue = this.parseExpression()
				this.consumePunc(',')

				contents[entryKey] = entryValue
			}

			this.consumePunc('}')

			return {
				kind: "literal",
				type: "obj",
				value: contents,
			};
		}

		this.parseList = () => {

		}

		// utility function, parses anything between start, stop, and delimiters using the given parser
		this.delimited = (start, stop, delimiter, parser) => {
			let resultList = [], first = true
			this.consumePunc(start)

			while(!this.tokenizer.eof()) {
				if(this.confirmPunc(stop)) break

				if(first) {
					first = false
				} else {
					this.consumePunc(delimiter)
				}

				if(this.confirmPunc(stop)) break

				resultList.push(parser())

			}
			this.consumePunc(stop)

			return resultList
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

	confirmKeyword(word) {
		let token = this.tokenizer.peek()
		return token && token.type === "kw" && (!word|| token.value === word) && token
	}

	// confirm and consume a token

	consumePunc(char) {
		if(this.confirmPunc(char)) this.tokenizer.next()
		else this.tokenizer.inputStream.err("Expecting punctuation: " + char + " but got " + this.tokenizer.peek().value)
	}

	consumeKeyword(word) {
		if(this.confirmKeyword(word)) this.tokenizer.next()
		else this.tokenizer.inputStream.err("Expecting keyword: " + word + " but got " + this.tokenizer.peek().value)
	}

	consumeOp(op) {
		if(this.confirmOp(op)) this.tokenizer.next()
		else this.tokenizer.inputStream.err("Expecting operator: " + op + " but got " + this.tokenizer.peek().value)
	}
}

module.exports = Parser