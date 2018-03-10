const InputStream = require("./InputStream")
const Tokenizer = require("./Tokenizer")

const ParseNode = require("./ParseNode")

const PRECEDENCE = {
	"=": 1, "+=": 1, "-=": 1, "*=": 1, "/=": 1, "%=": 1,
	"||": 2,
	"&&": 3,
	"==": 7, "!=": 7, "<": 7, ">": 7, "<=": 7, ">=": 7,
	"+": 10, "-": 10,
	"*": 20, "/": 20, "%": 20
}

// primitive types
const TYPES = {
	"null": new ParseNode("type", {
		baseType: "null",
		origin: "builtin"
	}),
	int: new ParseNode("type", {
		baseType: "int",
		origin: "builtin"
	}),
	float: new ParseNode("type", {
		baseType: "float",
		origin: "builtin"
	}),
	str: new ParseNode("type", {
		baseType: "str",
		origin: "builtin"
	}),
	bool: new ParseNode("type", {
		baseType: "bool",
		origin: "builtin"
	}),
	type: new ParseNode("type", {
		baseType: "type",
		origin: "builtin"
	})
}

const LITERALS = {
	"false": new ParseNode("literal", {
		type: TYPES.bool,
		value: false
	}),
	"true": new ParseNode("literal", {
		type: TYPES.bool,
		value: true
	}),
	"null": new ParseNode("literal", {
		type: TYPES.null,
		value: null
	}),
}

class Parser {
	constructor(input = null) {
		this.program = []
		if(input !== null) {
			this.load(input)
		}
	}

	load(input) {
		this.inputStream = new InputStream(input)
		this.tokenizer = new Tokenizer(this.inputStream)
		this.program = []
	}

	// entry point for all parsing operations
	parse() {
		this.program = []

		while (!this.tokenizer.eof()) {
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
			if(this.confirmToken('(', "punc")) {
				this.consumeToken('(', "punc")
				let contents = this.parseExpression()
				this.consumeToken(')', "punc")
				return contents
			}

			let nextToken = this.tokenizer.peek()

			if(this.confirmToken('{', "punc")) { // object literal
				return this.parseObjectLiteral()
			}

			if(this.confirmToken('[', "punc")) {
				return this.parseListLiteral()
			}

			if(this.confirmToken('<', "op") || this.confirmToken("<>", "op")) { // function literal
				return this.parseFunctionLiteral()
			}

			if(this.confirmToken('!', "op")) {
				this.consumeToken('!', "op")
				return new ParseNode("unary", {
					operator: "!",
					target: this.parseExpression(false),
				})
			}

			// type literals. "null" is always handled as a null literal, not a null type literal.
			if(["int", "float", "str", "bool", "fn", "obj", "type"].includes(nextToken.value) && nextToken.type !== "str") {
				return new ParseNode("literal", {
					type: TYPES.type,
					value: this.parseType()
				})
			}

			if(this.confirmToken(undefined, "kw")) {
				this.consumeToken(nextToken.value, "kw")

				switch (nextToken.value) {
					case "true":
						return LITERALS.true
					case "false":
						return LITERALS.false
					case "null":
						return LITERALS.null
					case "typeof":
						return new ParseNode("typeof", {
							target: this.parseExpression(false),
						})
					case "new":
						// this cannot be type-checked yet, there may be user-defined types
						let type = this.parseType()

						return new ParseNode("new", {
							target: type,
						})
					case "let":
						let identToken = this.tokenizer.next()
						if(identToken.type !== "var") {
							this.err(`Expected identifier but got ${identToken.value} (${identToken.type})`)
						}

						this.consumeToken('=', "op")

						let value = this.parseExpression()

						return new ParseNode("let", {
							identifier: identToken.value,
							value: value,
						})
					case "if":
						let ifCondition = this.parseExpression()
						let ifBody = this.parseBlock()

						let ifElse

						if(this.confirmToken("else", "kw")) {
							this.consumeToken("else", "kw")

							if(this.confirmToken('{', "punc")) { // else only
								ifElse = this.parseBlock()
							} else { // else-if
								ifElse = [this.parseExpression(false)]
							}
						}

						let ifStatement = new ParseNode("if", {
							condition: ifCondition,
							body: ifBody,
							else: ifElse,
						})

						return ifStatement
					case "while":
						let whileCondition = this.parseExpression()
						let whileBody = this.parseBlock()

						return new ParseNode("while", {
							condition: whileCondition,
							body: whileBody,
						})
					case "return":
						return new ParseNode("return", {
							value: this.parseExpression()
						})
					case "this":
						return new ParseNode("this", {})
					default:
						this.err("Unhandled keyword: " + nextToken.value)
				}
			}

			// from this point forward, nodes are generated directly, not dispatched
			this.tokenizer.next()

			// literals
			if(nextToken.type === "num") {
				if(nextToken.value % 1 !== 0) { // float
					return new ParseNode("literal", {
						type: TYPES.float,
						value: nextToken.value,
					})
				} else { // int
					return new ParseNode("literal", {
						type: TYPES.int,
						value: nextToken.value,
					})
				}
			}
			if(nextToken.type === "str") {
				return new ParseNode("literal", {
					type: TYPES.str,
					value: nextToken.value,
				})
			}

			// variable identifier
			if(nextToken.type === "var") {
				return new ParseNode("identifier", {
					name: nextToken.value,
				})
			}

			this.err("Unexpected token: " + JSON.stringify(nextToken))
		}

		// make a binary expression, with proper precedence, if needed
		let makeBinary = (left, currentPrecedence) => {
			let token = this.confirmToken(undefined, "op")
			if(token) {
				let nextPrecedence = PRECEDENCE[token.value]
				if(nextPrecedence > currentPrecedence) {
					this.tokenizer.next()
					let right = makeBinary(this.parseExpression(false), nextPrecedence)

					let binary = new ParseNode(
						["=", "+=", "-=", "*=", "/=", "%="].includes(token.value) ? "assign" : "binary", {
							operator: token.value,
							left: left,
							right: right,
						})

					return makeBinary(binary, currentPrecedence)
				}
			}

			return left // no RHS
		}

		let makeAs = (expression) => {
			if(this.confirmToken("as", "kw")) {
				this.consumeToken("as", "kw")

				return new ParseNode("as", {
					from: expression,
					to: this.parseType()
				})
			} else {
				return expression
			}
		}

		// make a function call if needed
		let makeCall = (expression) => {
			// it's a call if there's an open-paren after the expression.
			return this.confirmToken("(", "punc") ? new ParseNode("call", {
				arguments: this.delimited('(', ')', ',', () => {
					return this.parseExpression()
				}),
				target: expression,
			}) : expression
		}

		let makeObjAccess = (exp) => {
			if(this.confirmToken('.', "punc")) {
				this.consumeToken('.', "punc")

				let memberName = this.tokenizer.next()

				return new ParseNode("access", {
					method: "dot",
					target: exp,
					index: memberName.value,
				})
			} else {
				return exp
			}
		}

		// ambiguous access - could be list or object, impossible to tell until the index is evaluated
		let makeAccess = (exp) => {
			this.consumeToken("[", "punc")

			let indexExp = this.parseExpression()

			this.consumeToken("]", "punc")

			// list types like int[] are handled by parseType. Seeing a [ in this context guarantees it's an access
			return new ParseNode("access", {
				method: "bracket",
				target: exp,
				index: indexExp,
			})
		}

		let canStartBinary = () => canSplit && this.confirmToken(undefined, "op")
		let canStartCall = () => this.confirmToken("(", "punc")
		let canMakeAs = () => this.confirmToken("as", "kw")
		let canMakeObjAccess = () => this.confirmToken('.', "punc")
		let canMakeList = () => canSplit && this.confirmToken("[", "punc")

		let exp = parseExpressionAtom()

		// continuously build any post- or in-fix operator until no longer possible
		while ((canStartBinary() || canStartCall() || canMakeAs() || canMakeObjAccess() || canMakeList()) && !this.confirmToken(";", "punc")) {
			if(canStartBinary()) {
				exp = makeBinary(exp, 0)
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
		let structure = {}

		this.consumeToken('{', "punc")

		while (!this.confirmToken('}', "punc")) {
			let nextToken = this.tokenizer.next()

			let entryKey = nextToken.value

			this.consumeToken('=', "op")

			let entryValue = this.parseExpression()
			this.consumeToken(',', "punc")

			contents[entryKey] = entryValue
			structure[entryKey] = new ParseNode("type", entryValue.type)
		}

		this.consumeToken('}', "punc")

		return new ParseNode("literal", {
			type: new ParseNode("type", {
				baseType: "obj",
				origin: "builtin",
				structure: structure, // objects always default to rigid structure
			}),
			value: contents,
		})
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

		return new ParseNode("literal", {
			type: new ParseNode("type", {
				baseType: "fn",
				origin: "builtin",
				parameters: parameters.map((param, i) => {
					return param.type
				}),
				returns: returnType
			}),
			parameters: parameters,
			body: body,
			returns: returnType
		})
	}

	parseListLiteral() {
		let elements = []
		let listType = null
		this.delimited('[', ']', ',', () => {
			let val = this.parseExpression()

			if(listType === null) {
				listType = val.type
			}

			elements.push(val)
		})

		return new ParseNode("literal", {
			type: new ParseNode("type", {
				baseType: "list",
				origin: "builtin",
				contains: listType
			}),
			elements: elements
		})
	}

	// parse a type, whether built-in (int, str etc) or user-defined (fn, rigid obj)
	parseType() {
		let nextToken = this.tokenizer.next()

		let parseTypeAtom

		if(nextToken.type === "kw") { // built-in types
			switch (nextToken.value) {
				case "int":
					parseTypeAtom = TYPES.int
					break
				case "float":
					parseTypeAtom = TYPES.float
					break
				case "bool":
					parseTypeAtom = TYPES.bool
					break
				case "str":
					parseTypeAtom = TYPES.str
					break
				case "null":
					parseTypeAtom = TYPES.null
					break
				case "type":
					parseTypeAtom = TYPES.type
					break
				case "fn":
					let parameters = []

					if(this.confirmToken("<>", "op")) {
						this.consumeToken("<>", "op")
					} else {
						this.delimited('<', '>', ',', () => {
							parameters.push(this.parseType())
						})
					}

					let returnType = this.parseType()

					parseTypeAtom = new ParseNode("type", {
						origin: "builtin",
						baseType: "fn",
						parameters: parameters,
						returns: returnType,
					})
					break
				case "obj":
					let entries = {}

					this.delimited('{', '}', ',', () => {
						let entryType = this.parseType()
						let entryName = this.tokenizer.next()

						if(entryName.type !== "var") {
							this.err("Expected identifier but got: " + entryName.value)
						}

						entries[entryName.value] = entryType
					})

					parseTypeAtom = new ParseNode("type", {
						origin: "builtin",
						baseType: "obj",
						structure: entries,
					})

					break
				default:
					this.err("Expected type or type identifier but got keyword: " + nextToken.value)
			}
		} else if(nextToken.type === "var") { // user-named types
			// TODO types can come from expressions
			parseTypeAtom = new ParseNode("type", {
				origin: "named",
				name: nextToken.value,
			})
		} else {
			this.err("Expected type or type identifier but got " + nextToken.value)
		}

		if(this.confirmToken("[", "punc")) { // list type
			this.consumeToken("[", "punc")
			this.consumeToken("]", "punc")

			return new ParseNode("type", {
				baseType: "list",
				origin: "builtin",
				contains: parseTypeAtom,
			})
		} else {
			return parseTypeAtom
		}
	}

	// utility function, parses anything between start, stop, and delimiters using the given parser
	delimited(start, stop, delimiter, parser) {
		let resultList = [], first = true
		// this.consumePunc(start)
		this.consumeToken(start)

		while (!this.tokenizer.eof()) {
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
			const tokenKindFullNames = {
				kw: "keyword",
				"var": "identifier",
				op: "operator",
				num: "number",
				str: "string",
				punc: "symbol",
			}

			this.err(`Expecting ${(type !== "") ? tokenKindFullNames[type] + ": " : ""}"${value}" but got ${tokenKindFullNames[this.tokenizer.peek().type]}: "${this.tokenizer.peek().value}" instead`)
		}
	}

	err(message) {
		this.tokenizer.inputStream.err(message)
	}
}

module.exports = Parser
