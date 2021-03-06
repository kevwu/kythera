const InputStream = require("./InputStream")
const Tokenizer = require("./Tokenizer")

const ParseNode = require("./ParseNode")

const Scope = require("../compiler/Scope")

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

		// right now, the parser builds its own symbol table separately from the compiler stage.
		// these could be combined later.
		this.rootScope = new Scope()
		this.currentScope = this.rootScope

		if(input !== null) {
			this.load(input)
		}
	}

	load(input) {
		this.inputStream = new InputStream(input)
		this.tokenizer = new Tokenizer(this.inputStream)

		this.rootScope = new Scope()
		this.currentScope = this.rootScope

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

						this.currentScope.create(identToken.value, value.type)

						return new ParseNode("let", {
							identifier: identToken.value,
							value: value,
						})
					case "if":
						let ifCondition = this.parseExpression()

						this.currentScope = new Scope(this.currentScope, {scopeType: "controlflow"})
						let ifBody = this.parseBlock()
						this.currentScope = this.currentScope.parent

						let ifElse

						if(this.confirmToken("else", "kw")) {
							this.consumeToken("else", "kw")

							if(this.confirmToken('{', "punc")) { // else only
								this.currentScope = new Scope(this.currentScope, {scopeType: "controlflow"})
								ifElse = this.parseBlock()
								this.currentScope = this.currentScope.parent
							} else { // else-if
								ifElse = [this.parseExpression(false)]
							}
						}

						return new ParseNode("if", {
							condition: ifCondition,
							body: ifBody,
							"else": ifElse,
						})
					case "while":
						let whileCondition = this.parseExpression()

						this.currentScope = new Scope(this.currentScope, {scopeType: "controlflow"})
						let whileBody = this.parseBlock()
						this.currentScope = this.currentScope.parent

						return new ParseNode("while", {
							condition: whileCondition,
							body: whileBody,
						})
					case "return":
						// TODO check that scope is valid
						return new ParseNode("return", {
							value: this.parseExpression()
						})
					case "this":
						return new ParseNode("this", {type: this.currentScope.getThisType()})
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
					type: this.currentScope.get(nextToken.value)
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

		let makeDotAccess = (exp) => {
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
		let makeBracketAccess = (exp) => {
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
		let canMakeDotAccess = () => this.confirmToken('.', "punc")
		let canMakeBracketAccess = () => canSplit && this.confirmToken("[", "punc")

		let exp = parseExpressionAtom()

		// continuously build any post- or in-fix operator until no longer possible
		while ((canStartBinary() || canStartCall() || canMakeAs() || canMakeDotAccess() || canMakeBracketAccess()) && !this.confirmToken(";", "punc")) {
			if(canStartBinary()) {
				exp = makeBinary(exp, 0)
			}

			if(canMakeAs()) {
				exp = makeAs(exp)
			}


			if(canStartCall()) {
				exp = makeCall(exp)
			}

			if(canMakeDotAccess()) {
				exp = makeDotAccess(exp)
			}

			if(canMakeBracketAccess()) {
				exp = makeBracketAccess(exp)
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

		let objType = new ParseNode("type", {
			baseType: "obj",
			origin: "builtin",
			structure: {},
		})

		this.currentScope = new Scope(this.currentScope, {thisId: "thisObj", thisType: objType})
		while (!this.confirmToken('}', "punc")) {
			let nextToken = this.tokenizer.next()

			let entryKey = nextToken.value

			this.consumeToken('=', "op")

			let entryValue = this.parseExpression()
			this.consumeToken(',', "punc")

			contents[entryKey] = entryValue

			objType.structure[entryKey] = new ParseNode("type", entryValue.type)
		}

		this.consumeToken('}', "punc")

		// check for hanging deferred nodes (invalid references)
		Object.keys(objType.structure).forEach((key, i) => {
			if(objType.structure[key].deferred) {
				this.err("Access to nonexistent member " + key)
			}
		})

		return new ParseNode("literal", {
			type: objType,
			value: contents,
		})
	}

	parseFunctionLiteral() {
		// extend scope one level

		let returnType;
		this.currentScope = new Scope(this.currentScope, {scopeType: "function", returns: returnType})

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

				this.currentScope.create(paramName.value, paramType)

				return {
					name: paramName.value,
					type: paramType,
				}
			})
		}

		returnType = this.parseType()

		let body = this.parseBlock()

		// return to previous scope
		this.currentScope = this.currentScope.parent

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

	parseType() {
		let nextToken = this.tokenizer.peek()

		let parseTypeAtom

		let builtinType = true

		if(nextToken.type === "kw") { // built-in types
			// Unfortunately there is some code duplication here with this.tokenizer.next()
			// because fn and obj need to consume the token before they do any work.
			// However, if it is a derived type we must *not* consume the token.
			switch (nextToken.value) {
				case "int":
					parseTypeAtom = TYPES.int
					this.tokenizer.next()

					break
				case "float":
					parseTypeAtom = TYPES.float
					this.tokenizer.next()

					break
				case "bool":
					parseTypeAtom = TYPES.bool
					this.tokenizer.next()

					break
				case "str":
					parseTypeAtom = TYPES.str
					this.tokenizer.next()

					break
				case "null":
					parseTypeAtom = TYPES.null
					this.tokenizer.next()

					break
				case "type":
					parseTypeAtom = TYPES.type
					this.tokenizer.next()

					break
				case "list":
					this.tokenizer.next()

					this.consumeToken('[', "punc")
					const containedType = this.parseType()
					this.consumeToken(']', "punc")

					parseTypeAtom = new ParseNode("type", {
						baseType: "list",
						origin: "builtin",
						contains: containedType,
					})

					break
				case "fn":
					let parameters = []

					this.tokenizer.next()

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

					this.tokenizer.next()

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
					builtinType = false
			}

		} else {
			builtinType = false
		}

		if(!builtinType) {
			parseTypeAtom = new ParseNode("type", {
				origin: "derived",
				exp: this.parseExpression(false) // disallow splitting so '>' isn't confused for "greater-than"
			})
		}

		return parseTypeAtom
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

			if(this.confirmToken(stop)) {
				break
			}

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
