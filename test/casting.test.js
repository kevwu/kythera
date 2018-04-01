const t = require("./util").test

describe("Type casting", () => {
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

	// TODO re-enable (and possibly rewrite) these tests once type casting ('as') is implemented
	/*
	t("Casting object", `
let myObj = {
    a = 99,
    b = "beep",
}

myObj.a

(myObj as myObjType).a

myObj.a + 10

let myCastedObj = myObj as myObjType
typeof myCastedObj

typeof myCastedObj == typeof myObj
typeof myCastedObj == typeof (myObj as myObjType)	
	`, {skip: true})
	*/

	/*
	t("Usage as fn param", `
let myObjType = obj{
    int a,
    str b,
}
	
let myObj = {
    a = 99,
    b = "beep",
}

let myCastedObj = myObj as myObjType

// rigid object type use in function
let myFn = <myObjType object> null {
    object.a
    object.b
    return 10
}

myFn(myObj as myObjType)
myFn(myCastedObj)	
	`, {skip: true})
	*/
})
