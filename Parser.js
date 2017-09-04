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
				if(!this.confirmToken(';', "punc")){
					this.tokenizer.inputStream.err("Missing semicolon")
				}
				this.consumeToken(';', "punc")
				console.log(JSON.stringify(this.program, null, 2))
			}
		}

		// all parse functions return the AST subtree for what they encountered.


		this.parseExpression = (canStartBinary = true) => {

			// main dispatcher, parses expression parts that don't need lookahead
			let parseExpressionAtom = () => {
				// unwrap parentheses first
				if (this.confirmToken('(', "punc")) {
					this.consumeToken('(', "punc")
					let contents = this.parseExpression()
					this.consumeToken(')', "punc")
					return contents
				}

				let nextToken = this.tokenizer.peek()
				console.log("About to handle:")
				console.log(nextToken)

				if (this.confirmToken('{', "punc")) { // object literal
					return this.parseObjectLiteral()
				}

				if(this.confirmToken('<', "op")) { // function literal
					return this.parseFunctionLiteral()
				}

				if (this.confirmToken('[', "punc")) {
					return this.parseList()
				}

				if(this.confirmToken('!', "op")) {
					this.consumeToken('!', "op")
					return {
						kind: "unary",
						operator: "!",
						target: this.parseExpression(false),
					}
				}

				if (this.confirmToken(undefined, "kw")) {

					this.consumeToken(nextToken.value, "kw")

					switch (nextToken.value) {
						case "true":
							return Parser.LITERALS.true
						case "false":
							return Parser.LITERALS.false
						case "null":
							return Parser.LITERALS.null
						case "typeof":
							return {
								kind: "typeof",
								target: this.parseExpression(false),
							}
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
						case "let":
							let identToken = this.tokenizer.next()
							if(identToken.type !== "var") {
								this.tokenizer.inputStream.err(`Expected identifier but got ${nameToken.value} (${nameToken.type})`)
							}

							this.consumeToken('=', "op")

							let value = this.parseExpression()

							return {
								kind: "let",
								identifier: identToken,
								value: value,
							}
						case "if":
							let ifCondition = this.parseExpression()
							let ifBody = this.parseBlock()

							let ifStatement = {
								kind: "if",
								condition: ifCondition,
								body: ifBody,
							}

							if(this.confirmToken("else", "kw")) {
								this.consumeToken("else", "kw")

								// else only
								if(this.confirmToken('{', "punc")) {
									ifStatement.else = this.parseBlock()
								} else {
									// else-if
									ifStatement.else = this.parseExpression(false)
								}
							}

							return ifStatement
						case "while":
							let whileCondition = this.parseExpression()
							let whileBody = this.parseBlock()

							return {
								kind: "while",
								condition: whileCondition,
								body: whileBody,
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
					if(this.confirmToken('.', "punc")) {
						this.consumeToken('.', "punc")

						let memberName = this.tokenizer.next()

						return {
							kind: "objAccess",
							obj: nextToken.value,
							member: memberName.value,
						}
					} else {
						return {
							kind: "identifier",
							name: nextToken.value,
						}
					}
				}

				this.tokenizer.inputStream.err("Unexpected token: " + JSON.stringify(nextToken))
			}

			// make a binary expression, with proper precedence, if needed
			let makeBinary = (left, currentPrecedence) => {
				let token = this.confirmToken(undefined, "op")
				if(token) {
					let nextPrecedence = Parser.PRECEDENCE[token.value]
					if(nextPrecedence > currentPrecedence) {
						this.tokenizer.next()
						let right = makeBinary(this.parseExpression(false), nextPrecedence)

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

			let makeAs = (expression) => {
				if(this.confirmToken("as", "kw")) {
					this.consumeToken("as", "kw")

					return {
						kind: "as",
						from: expression,
						to: this.parseType()
					}
				} else {
					return expression
				}
			}


			// make a function call if needed
			let makeCall = (expression) => {
				// it's a call if there's an open-paren after the expression.
				return this.confirmToken("(", "punc") ? {
					kind: "call",
					arguments: this.delimited('(', ')', ',', () => {
						return this.parseExpression()
					}),
					target: expression,
				} : expression
			}

			if(canStartBinary) {
				return makeCall(makeBinary(makeAs(parseExpressionAtom()), 0))
			} else {
				return makeCall((makeAs(parseExpressionAtom())))
			}
		}

		// parse a block of statements
		this.parseBlock = () => {
			return this.delimited('{', '}', ';', this.parseExpression)
		}

		// parse an object literal
		this.parseObjectLiteral = () => {
			let contents = {}

			this.consumeToken('{', "punc")

			while (!this.confirmToken('}', "punc")) {
				let nextToken = this.tokenizer.next()

				let entryKey = nextToken.value

				this.consumeToken('=', "op")

				let entryValue = this.parseExpression()
				this.consumeToken(',', "punc")

				contents[entryKey] = entryValue
			}


			this.consumeToken('}', "punc")

			return {
				kind: "literal",
				type: "obj",
				value: contents,
			};
		}

		this.parseFunctionLiteral = () => {
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

						let returnType = this.parseType()

						return {
							kind: "type",
							origin: "builtin",
							type: "fn",
							parameters: parameters,
							returns: returnType,
						}
					case "obj":
						let entries = {}

						this.delimited('{', '}', ',', () => {
							let entryType = this.parseType()
							let entryName = this.tokenizer.next()

							if(entryName.type !== "var") {
								this.tokenizer.inputStream.err("Expected identifier but got: " + entryName.value)
							}

							console.log(entryType)
							console.log(entryName)

							entries[entryName.value] = entryType
						})

						return {
							kind: "type",
							origin: "builtin",
							type: "obj",
							structure: entries,
						}

						return
					default:
						this.tokenizer.inputStream.err("Expected type or type identifier but got keyword: " + nextToken.value)
				}
			} else if(nextToken.type === "var") { // user-named types
				// TODO types can come from expressions
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
	confirmToken(value = "", type = "") {
		if(this.tokenizer.eof()) {
			return false
		}

		let token = this.tokenizer.peek()

		if(type !== "" && token.type !== type) {
			return false
		}

		if(value !== "" && token.value !== value) {
			return false
		}

		return token
	}

	// confirm and consume a token
	consumeToken(value, type = "") {
		if(this.confirmToken(value, type)) {
			this.tokenizer.next()
		} else {
			const kindFullNames = {
				kw: "keyword",
				op: "operator",
				num: "number",
				str: "string",
				punc: "symbol",
			}

			this.tokenizer.inputStream.err(`Expecting ${(type !== "") ? kindFullNames[type] + ": " : ""}"${value}" but got ${kindFullNames[this.tokenizer.peek().type]}: "${this.tokenizer.peek().value}" instead`)
		}
	}
}

module.exports = Parser