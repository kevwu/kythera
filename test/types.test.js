const t = require("./util").test

describe("Types", () => {
	describe("Derived types", () => {
		t("Basic usage", `
let price = int
let a = new price
		`)

		t("Object type", `
let myDataType = obj{
	int a,
	str b,
}

let myVal = new myDataType

let out1 = typeof myVal
		`)

		t("Conditional type", `
let randomTF = <> bool {
	return false
}

let myOriginType = new type

if randomTF() {
	myOriginType = int
} else {
	myOriginType = str
}

let myVal = new myOriginType
		`)

		t("Use parameter type value as return type", `
let myGenericFn = <type T> T {
	let a = new T
	return a
}

myGenericFn(int)
		`, {skip: true})
	})

	describe("Custom type assignment", () => {
		t("primitive", `let myIntType = int`)
		// parameter list is read as (int), (str), (myIntType > str) and then hits unexpected EOL
		// TODO fix this, possibly by changing the syntax for functions
		// in the meantime this can be fixed with a trailing comma
		t("fn type", `
let myIntType = int
let myFnType = fn<int, str, myIntType,> str`)
		t("obj type", `
let myObjType = obj{
    int a,
    str b,
}
	`, {skip: true})
	})

	describe("Type casting", () => {
		describe("Primitives", () => {
			describe("bool", () => {
				t("true to int", `let out = true as int`)
				t("false to int", `let out = false as int`)

				t("true to float", `let out = true as float`)
				t("false to float", `let out = false as float`)

				t("true to str", `let out = true as str`)
				t("false to str", `let out = false as str`)
			})

			describe("int", () => {
				t("0 to bool", `let out = 0 as bool`)
				t("1 to bool", `let out = 1 as bool`)
				t("other int to bool", `let out = 99 as bool`)

				t("int to float", `let out = 1 as float`)

				t("int to str", `let out = 0 as str`)
			})

			describe("float", () => {
				t("0.0 to bool", `let out = 0.0 as bool`)
				t("1.0 to bool", `let out = 1.0 as bool`)
				t("1.1 to bool", `let out = 1.1 as bool`)

				t("float to int", `let out = 1.1 as int`)
				t("float (truncate) to int", `let out = 1.9 as int`)

				t("float to str", `let out = 3.14159 as str`)
			})

			describe("str", () => {
				// str can cast to str for compatibility purposes. Everything must be able to cast to str.
				t("str to str", `let out = "asdf" as str`)
			})

			describe("null", () => {
				t("null to str", `let out = null as str`)
			})

			describe("fn", () => {
				t("empty fn to str", `let out = <> null { return null } as str`)
				t("fn with one param to str", `let out = <int a> null { return null } as str`)
				t("fn with multiple params to str", `let out = <int a, str b, bool c> null { return null } as str `)

			})

			describe("obj", () => {
				// object-to-object casting is tested elsewhere.
				t("empty object to str", `let out = {} as str`)
				t("object with one member to str", `let out = { a = 10, } as str`)
				t("object with multiple members to str", `
let	out = {
	a = true,
	b = 0,
	c = 3.14159,
	d = "asdf",
	e = null,
	f = <int a, str b, bool c > null { return null },
	g = {
		a = 0,
		b = "asdf",
	},
} as str
				`)
			})

			describe("type", () => {
				t("bool type to str", `
				let out1 = bool as str
				let out2 = (typeof true) as str
				`)
				t("int type to str", `
				let out1 = int as str
				let out2 = (typeof 0) as str
				`)
				t("float type to str", `
				let out1 = float as str
				let out2 = (typeof 3.14159) as str
				`)
				t("str type as str", `
				let out1 = str as str
				let out2 = (typeof "asdf") as str
				`)
				// there is no type literal for null. The null type can only be accessed by "typeof null".
				t("null type as str", `
				let out = (typeof null) as str
				`)
				t("empty fn type to str", `
				let out1 = fn<> null as str
				let out2 = (typeof <> null { return null }) as str
				`)
				t("fn type with one param to str", `
				let out1 = fn<int> null as str
				let out2 = (typeof <int a> null { return null }) as str
				`)
				t("fn type with multiple params to str", `
				let out1 = fn<int, str, bool> null as str
				let out2 = <int a, str b, bool c> null { return null } as str
				`)
				t("empty object type to str", `
				let out1 = obj{} as str
				let out2 = (typeof {}) as str
				`)
				t("object type with one member to str", `
				let out1 = obj{int a,} as str
				let out2 = (typeof { a = 10, }) as str
				`)
				t("object type with multiple members to str", `
let out1 = obj{
	bool a,
	int b,
	float c,
	str d,
	null e,
	fn<int, str, bool> null f,
	obj{
		int a,
		str b,
	} g,
} as str
let	out2 = (typeof {
	a = true,
	b = 0,
	c = 3.14159,
	d = "asdf",
	e = null,
	f = <int a, str b, bool c > null { return null },
	g = {
		a = 0,
		b = "asdf",
	},
}) as str
				`)
			})
		})
	})
})

