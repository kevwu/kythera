const t = require("./util").test

describe("Type casting", () => {
	// TODO type casting is about to be completely overhauled so these tests are disabled
	describe("Custom type assignment", () => {
		t("primitive", `let myIntType = int`, {skip: true})
		t("fn type", `let myFnType = fn<int, str, myIntType> str`, {skip: true})
		t("obj type", `
let myObjType = obj{
    int a,
    str b,
}
	`, {skip: true})
	})

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
