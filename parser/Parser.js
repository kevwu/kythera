const InputStream = require("./InputStream")
const Tokenizer = require("./Tokenizer")

const ParserConstants = {
	"PRECEDENCE": {
			"=": 1,
			"||": 2,
			"&&": 3,
			"<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
			"+": 10, "-": 10,
			"*": 20, "/": 20, "%": 20
	},
	"LITERALS": {
		"false": {
			"kind": "literal",
			"type": "bool",
			"value": false
		},
		"true": {
			"kind": "literal",
			"type": "bool",
			"value": true
		},
		"null": {
			"kind": "literal",
			"type": "null",
			"value": null
		}
	},
	"TYPES": {
		"null": {
			"kind": "type",
			"type": "null",
			"origin": "builtin"
		},
		"int": {
			"kind": "type",
			"type": "int",
			"origin": "builtin"
		},
		"float": {
			"kind": "type",
			"type": "float",
			"origin": "builtin"
		},
		"str": {
			"kind": "type",
			"type": "str",
			"origin": "builtin"
		},
		"bool": {
			"kind": "type",
			"type": "bool",
			"origin": "builtin"
		}
	}
}


class Parser {
	constructor(input) {
		this.inputStream = new InputStream(input)
		this.tokenizer = new Tokenizer(this.inputStream)
		this.program = []
	}

		// entry point for all parsing operations
	parse() {
		while(!this.tokenizer.eof()) {
			this.program.push(this.parseExpression())
			if(!this.confirmToken(';', "punc")) {
				this.err("Missing semicolon")
			}
			this.consumeToken(';', "punc")
		}

		return this.program
	}

	// all parse functions return the AST subtree for what they encountered.

	// main dispatcher, parses expression parts that don't need lookahead
	parseExpression(canSplit = true) {
		let parseExpressionAtom = () => {
			// unwrap parentheses first
			if (this.confirmToken('(', "punc")) {
				this.consumeToken('(', "punc")
				let contents = this.parseExpression()
				this.consumeToken(')', "punc")
				return contents
			}

			let nextToken = this.tokenizer.peek()

			if (this.confirmToken('{', "punc")) { // object literal
				return this.parseObjectLiteral()
			}

			if(this.confirmToken('<', "op") || this.confirmToken("<>", "op")) { // function literal
				return this.parseFunctionLiteral()
			}

			if(this.confirmToken('!', "op")) {
				this.consumeToken('!', "op")
				return {
					kind: "unary",
					operator: "!",
					target: this.parseExpression(false),
				}
			}

			// type literals. "null" is always handled as a null literal, not a type literal.
			if(["int", "float", "str", "fn", "obj"].includes(nextToken.value)) {
				return {
					kind: "literal",
					type: "type",
					value: this.parseType()
				}
			}

			if (this.confirmToken(undefined, "kw")) {
				this.consumeToken(nextToken.value, "kw")

				switch (nextToken.value) {
					case "true":
						return ParserConstants.LITERALS.true
					case "false":
						return ParserConstants.LITERALS.false
					case "null":
						return ParserConstants.LITERALS.null
					case "typeof":
						return {
							kind: "typeof",
							target: this.parseExpression(false),
						}
					case "new":
						// this cannot be type-checked yet, there may be user-defined types
						let type = this.parseType()

						return {
							kind: "new",
							target: type,
						}
					case "let":
						let identToken = this.tokenizer.next()
						if(identToken.type !== "var") {
							this.err(`Expected identifier but got ${identToken.value} (${identToken.type})`)
						}

						this.consumeToken('=', "op")

						let value = this.parseExpression()

						return {
							kind: "let",
							identifier: identToken.value,
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
						this.err("Unhandled keyword: " + nextToken.value)
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

			this.err("Unexpected token: " + JSON.stringify(nextToken))
		}

		// make a binary expression, with proper precedence, if needed
		let makeBinary = (left, currentPrecedence) => {
			let token = this.confirmToken(undefined, "op")
			if(token) {
				let nextPrecedence = ParserConstants.PRECEDENCE[token.value]
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

		let makeObjAccess = (exp) => {
			if(this.confirmToken('.', "punc")) {
				this.consumeToken('.', "punc")

				let memberName = this.tokenizer.next()

				return {
					kind: "objAccess",
					obj: exp,
					member: memberName.value,
				}
			} else {
				return exp
			}
		}

		// ambiguous access - could be list or object, impossible to tell until the index is evaluated
		let makeAccess = (exp) => {
			this.consumeToken("[", "punc")

			let indexExp = this.parseExpression()

			this.consumeToken("]", "punc")

			// list types like int[] are handled by parseType. This is guaranteed to be an access
			return {
				kind: "access",
				target: exp,
				index: indexExp,
			}
		}


		let canStartBinary = () => canSplit && this.confirmToken(undefined, "op")
		let canStartCall = () => this.confirmToken("(", "punc")
		let canMakeAs = () => this.confirmToken("as", "kw")
		let canMakeObjAccess = () => this.confirmToken('.', "punc")
		let canMakeList = () => canSplit && this.confirmToken("[", "punc")

		let exp = parseExpressionAtom()

		// continuously build any post- or in-fix operator until no longer possible
		while((canStartBinary() || canStartCall() || canMakeAs() || canMakeObjAccess() || canMakeList()) && !this.confirmToken(";", "punc")) {
			if(canStartBinary()) {
				exp = makeBinary(exp,0)
			}

			if(canMakeAs()) {
				exp = makeAs(exp)
			}


			if(canStartCall()) {
				exp = makeCall(exp)
			}

			if(canMakeObjAccess()) {
				exp = makeObjAccess(exp)
			}

			if(canMakeList()) {
				exp = makeAccess(exp)
			}
		}

		return exp
	}

	// parse a block of statements
	parseBlock() {
		return this.delimited('{', '}', ';', () => this.parseExpression())
	}

	// parse an object literal
	parseObjectLiteral() {
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
		}
	}

	parseFunctionLiteral() {
		let parameters
		if(this.confirmToken("<>", "op")) {
			this.consumeToken("<>", "op")
			parameters = []
		} else {
			parameters = this.delimited('<', '>', ',', () => {
				let paramType = this.parseType()
				let paramName = this.tokenizer.next()

				if(paramName.type !== "var") {
					this.err("Expected identifier but got " + paramName.value)
				}

				return {
					name: paramName.value,
					type: paramType,
				}
			})
		}

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

	// parse a type, whether built-in (int, str etc) or user-defined (fn, rigid obj)
	parseType() {
		let nextToken = this.tokenizer.next()

		let parseTypeAtom

		if (nextToken.type === "kw") { // built-in types
			switch (nextToken.value) {
				case "int":
					parseTypeAtom = ParserConstants.TYPES.int
					break
				case "float":
					parseTypeAtom = ParserConstants.TYPES.float
					break
				case "bool":
					parseTypeAtom = ParserConstants.TYPES.bool
					break
				case "str":
					parseTypeAtom = ParserConstants.TYPES.str
					break
				case "null":
					parseTypeAtom = ParserConstants.TYPES.null
					break
				case "fn":
					let parameters = []

					if (this.confirmToken("<>", "op")) {
						this.consumeToken("<>", "op")
					} else {
						this.delimited('<', '>', ',', () => {
							parameters.push(this.parseType())
						})
					}

					let returnType = this.parseType()

					parseTypeAtom = {
						kind: "type",
						origin: "builtin",
						type: "fn",
						parameters: parameters,
						returns: returnType,
					}
					break
				case "obj":
					let entries = {}

					this.delimited('{', '}', ',', () => {
						let entryType = this.parseType()
						let entryName = this.tokenizer.next()

						if (entryName.type !== "var") {
							this.err("Expected identifier but got: " + entryName.value)
						}

						entries[entryName.value] = entryType
					})

					parseTypeAtom = {
						kind: "type",
						origin: "builtin",
						type: "obj",
						structure: entries,
					}

					break
				default:
					this.err("Expected type or type identifier but got keyword: " + nextToken.value)
			}
		} else if (nextToken.type === "var") { // user-named types
			// TODO types can come from expressions
			parseTypeAtom = {
				kind: "type",
				origin: "named",
				name: nextToken.value,
			}
		} else {
			this.err("Expected type or type identifier but got " + nextToken.value)
		}

		// TODO this might not need to be written as a separate function and can be streamlined
		if(this.confirmToken("[", "punc")) { // list type
			this.consumeToken("[", "punc")
			this.consumeToken("]", "punc")

			return {
				kind: "type",
				type: "list",
				listType: parseTypeAtom,
			}
		} else {
			return parseTypeAtom
		}
	}

	// utility function, parses anything between start, stop, and delimiters using the given parser
	delimited(start, stop, delimiter, parser) {
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

			this.err(`Expecting ${(type !== "") ? kindFullNames[type] + ": " : ""}"${value}" but got ${kindFullNames[this.tokenizer.peek().type]}: "${this.tokenizer.peek().value}" instead`)
		}
	}
	
	err(message) {
		this.tokenizer.inputStream.err(message)
	}
}

module.exports = Parser
