class Tokenizer {
	constructor(inputStream) {
		this.currentToken = null
		this.inputStream = inputStream
		Tokenizer.keywords = "let new name if else while each return break continue typeof bool int float str fn obj list import export include	this true false null "

		// read as long as we are not at eof and the condition given is true for the next character
		this.readWhile = (condition) => {
			let output = "";
			while(!this.inputStream.eof() && condition(this.inputStream.peek())) {
				output += this.inputStream.next();
			}
			return output
		}

		this.readEscaped = (end) => {
			let escaped = false, str = ""
			this.inputStream.next()

			while(!this.inputStream.eof()) {
				let char = this.inputStream.next()

				if(escaped) {
					str += char
					escaped = false
				} else if(char === "\\") {
					escaped = true
				} else if(char === end) {
					break;
				} else {
					str += char
				}
			}

			return str
		}

		// consumes characters until newline
		this.readToNewline = () => {
			this.readWhile((char) => {
				return char !== "\n"
			})
			this.inputStream.next()
		}

		// dispatch function for all token kinds
		this.readNextToken = () => {
			this.readWhile(Tokenizer.isWhitespace)

			if(this.inputStream.eof()) return null

			let char = this.inputStream.peek()
			if(char === "/") {
				this.readToNewline()
				return this.readNextToken()
			}

			if(char === '"' || char === "'") return this.tokenFromString()
			if(Tokenizer.isDigit(char)) return this.tokenFromNumber()
			if(Tokenizer.isIdentStart(char)) return this.tokenFromIdent()
			if(Tokenizer.isPunc(char)) return {
				type: 'punc',
				value: this.inputStream.next()
			}
			if(Tokenizer.isOp(char)) return {
				type: 'op',
				value: this.readWhile(Tokenizer.isOp)
			}

			this.inputStream.err("Cannot handle character: " + char)
		}

		this.tokenFromString = () => {
			return {
				type: "str",
				value: this.readEscaped('"')
			}
		}


		// functions for reading specific kinds of tokens
		this.tokenFromNumber = () => {
			let hasDot = false
			let number = this.readWhile((char) => {
				if(char === ".") {
					if (hasDot) {
						return false // two dots encountered, abort
					}

					hasDot = true
					return true
				}

				return Tokenizer.isDigit(char)
			})

			return {
				type: "num",
				value: parseFloat(number)

			}
		}

		this.tokenFromIdent = () => {
			let id = this.readWhile(Tokenizer.isIdent)
			return {
				type: Tokenizer.isKeyword(id) ? "kw" : "var",
				value: id
			}
		}

		// peek next token
		this.peek = () => {
			return this.currentToken || (this.currentToken = this.readNextToken())
		}

		// read and consume next token
		this.next = () => {
			let token = this.currentToken
			this.currentToken = null
			return token || this.readNextToken()
		}

		this.eof = () => {
			return this.peek() === null
		}
	}

	// boolean utility functions for detecting token types

	static isKeyword(word) {
		return Tokenizer.keywords.indexOf(" " + word + " ") >= 0
	}

	static isDigit(char) {
		return /[0-9]/i.test(char);
	}

	// true if this could be the start of an identifier
	static isIdentStart(char) {
		return /[a-z_]/i.test(char);
	}

	// true if this could be in an identifier
	static isIdent(char) {
		return Tokenizer.isIdentStart(char) || "_0123456789".indexOf(char) >= 0;
	}

	static isOp(char) {
		return "+-*/%=&|<>!".indexOf(char) >= 0
	}

	static isPunc(char) {
		return ",;(){}[]:.".indexOf(char) >= 0
	}

	static isWhitespace(char) {
		return " \t\n".indexOf(char) >= 0
	}
}

module.exports = Tokenizer