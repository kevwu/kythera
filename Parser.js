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

		Parser.LITERALS = {}

		Parser.LITERALS.false = {
			kind: "literal",
			type: "bool",
			value: false
		}

		Parser.LITERALS.true = {
			kind: "literal",
			type: "bool",
			value: true
		}

		Parser.LITERALS.null = {
			kind: "literal",
			type: "null",
			value: null,
		}

		Parser.TYPES = {}

		Parser.TYPES.null = {
			kind: "type",
			type: "null",
			origin: "builtin",
		}

		Parser.TYPES.int = {
			kind: "type",
			type: "int",
			origin: "builtin",
		}

		Parser.TYPES.float = {
			kind: "type",
			type: "float",
			origin: "builtin",
		}

		Parser.TYPES.str = {
			kind: "type",
			type: "str",
			origin: "builtin",
		}

		Parser.TYPES.bool = {
			kind: "type",
			type: "bool",
			origin: "builtin",
		}

		// entry point for all parsing operations
		this.parse = () => {
			while(!this.tokenizer.eof()) {
				this.program.push(this.parseExpression())
				if(!this.confirmPunc(';')){
					this.tokenizer.inputStream.err("Missing semicolon")
				}
				this.consumePunc(';')
				console.log(JSON.stringify(this.program, null, 2))
			}
		}

		// all parse functions return the AST subtree for what they encountered.


		this.parseExpression = () => {

			// main dispatcher, parses expression parts that don't need lookahead
			let parseExpressionAtom = () => {
				// unwrap parentheses first
				if (this.confirmPunc('(')) {
					this.consumePunc('(')
					let contents = this.parseExpression()
					this.consumePunc(')')
					return contents
				}

				let nextToken = this.tokenizer.peek()
				console.log("About to handle:")
				console.log(nextToken)

				if (this.confirmPunc('{')) { // object literal
					return this.parseObjectLiteral()
				}

				if(this.confirmOp('<')) { // function literal
					let parameters = this.delimited('<', '>', ',', () => {
						let paramType = this.parseType()
						let paramName = this.tokenizer.next()

						if(paramName.type !== "var") {
							this.tokenizer.inputStream.err("Expected identifier but got " + paramName.value)
						}

						return {
							name: paramName.value,
							type: paramType,
						}
					})

					console.log(parameters)

					let returnType = this.parseType()

					let body = this.parseBlock()

					return {
						kind: "literal",
						type: "fn",
						parameters: parameters,
						body: body,
						returns: returnType
					}
				}

				/*
				if (this.confirmPunc('[')) {
					return this.parseList()
				}
				*/

				if(this.confirmOp('!')) {
					this.consumeOp('!')
					return {
						kind: "unary",
						operator: "!",
						target: this.parseExpression(),
					}
				}

				if (this.confirmKeyword()) {

					this.consumeKeyword(nextToken.value)

					switch (nextToken.value) {
						case "true":
							return Parser.LITERALS.true
						case "false":
							return Parser.LITERALS.false
						case "typeof":
							return {
								kind: "typeof",
								target: this.parseExpression(),
							}
						case "null":
							return Parser.LITERALS.null
						case "new":
							// this cannot be type-checked yet, there may be user-defined types

							let type = this.parseType()

							if(type.type === "fn") {
								this.tokenizer.inputStream.err("fn types cannot be initialized from new.")
							}

							return {
								kind: "new",
								target: type,
							}
						case "name":
							let nameToken = this.tokenizer.next()
							if(nameToken.type !== "var") {
								this.tokenizer.inputStream.err(`Expected identifier but got ${nameToken.value} (${nameToken.type})`)
							}

							return {
								kind: "name",
								name: nameToken.value,
								target: this.parseType(),
							}
						case "return":
							return {
								kind: "return",
								value: this.parseExpression()
							}
						default:
							this.tokenizer.inputStream.err("Unhandled keyword: " + nextToken.value)
					}
				}

				// from this point forward, nodes are generated directly, not dispatched
				this.tokenizer.next()

				// literals
				if (nextToken.type === "num") {
					if (nextToken.value % 1 !== 0) { // float
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
				if (nextToken.type === "str") {
					return {
						kind: "literal",
						type: "str",
						value: nextToken.value,
					}
				}

				// variable identifier
				if (nextToken.type === "var") {
					return {
						kind: "identifier",
						name: nextToken.value,
					}
				}

				this.tokenizer.inputStream.err("Unexpected token: " + JSON.stringify(nextToken))
			}

			// make a binary expression, with proper precedence, if needed
			let makeBinary = (left, currentPrecedence) => {
				let token = this.confirmOp()
				if(token) {
					let nextPrecedence = Parser.PRECEDENCE[token.value]
					if(nextPrecedence > currentPrecedence) {
						this.tokenizer.next()
						let right = makeBinary(this.parseExpression(), nextPrecedence)

						let binary = {
							kind: token.value === "=" ? "assign" : "binary",
							operator: token.value,
							left: left,
							right: right,
						}

						return makeBinary(binary, currentPrecedence)
					}
				}

				return left // no RHS
			}


			// make a function call if needed
			let makeCall = (expression) => {
				// it's a call if there's an open-paren after the expression.
				return this.confirmPunc("(") ? {
					kind: "call",
					arguments: this.delimited('(', ')', ',', () => {
						return this.parseExpression()
					}),
					target: expression,
				} : expression
			}

			return makeCall(makeBinary(parseExpressionAtom(), 0))
		}

		// parse a block of statements
		this.parseBlock = () => {
			return this.delimited('{', '}', ';', this.parseExpression)
		}

		// parse an object literal
		this.parseObjectLiteral = () => {
			let contents = {}

			this.consumePunc('{')

			while (!this.confirmPunc('}')) {
				let nextToken = this.tokenizer.next()

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


		// parse a type, whether built-in (int, str etc) or user-defined (fn, rigid obj)
		this.parseType = () => {
			let nextToken = this.tokenizer.next()

			if(nextToken.type === "kw") { // built-in types
				switch(nextToken.value) {
					case "int":
						return Parser.TYPES.int
					case "float":
						return Parser.TYPES.float
					case "bool":
						return Parser.TYPES.bool
					case "str":
						return Parser.TYPES.str
					case "null":
						return Parser.TYPES.null
					case "fn":
						let parameters = []

						this.delimited('<', '>', ',', () => {
							parameters.push(this.parseType())
						})

						console.log(parameters)

						let returnType = this.parseType()

						return {
							kind: "type",
							origin: "builtin",
							type: "fn",
							parameters: parameters,
							returns: returnType,
						}
					case "obj":
						return
					default:
						this.tokenizer.inputStream.err("Expected type or type identifier but got keyword: " + nextToken.value)
				}
			} else if(nextToken.type === "var") { // user-named types
				return {
					kind: "type",
					origin: "named",
					name: nextToken.value,
				}
			} else {
				this.tokenizer.inputStream.err("Expected type or type identifier but got " + nextToken.value)
			}
		}

		// utility function, parses anything between start, stop, and delimiters using the given parser
		this.delimited = (start, stop, delimiter, parser) => {
			let resultList = [], first = true
			// this.consumePunc(start)
			this.consumeToken(start)

			while(!this.tokenizer.eof()) {
				if(this.confirmToken(stop)) break

				if(first) {
					first = false
				} else {
					this.consumeToken(delimiter)
				}

				if(this.confirmToken(stop)) break

				resultList.push(parser())

			}
			this.consumeToken(stop)

			return resultList
		}
	}

	// confirm a token without consuming it

	confirmPunc(char) {
		if(this.tokenizer.eof()) return false
		let token = this.tokenizer.peek()
		return token && token.type === "punc" && (!char || token.value === char) && token
	}

	confirmOp(op) {
		if(this.tokenizer.eof()) return false
		let token = this.tokenizer.peek()
		return token && token.type === "op" && (!op || token.value === op) && token
	}

	confirmKeyword(word) {
		if(this.tokenizer.eof()) return false
		let token = this.tokenizer.peek()
		return token && token.type === "kw" && (!word|| token.value === word) && token
	}

	// generic confirm
	confirmToken(value) {
		if(this.tokenizer.eof()) return false
		let token = this.tokenizer.peek()
		return (!value || token.value === value) && token
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

	// generic consume
	consumeToken(value) {
		if(this.confirmToken(value)) this.tokenizer.next()
		else this.tokenizer.inputStream.err("Expecting " + value + " but got + " + this.tokenizer.peek().value)
	}
}

module.exports = Parser