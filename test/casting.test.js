const t = require("./util").test

describe("Type casting", () => {
	describe("Custom type assignment", () => {
		t("primitive", `let myIntType = int`, {compile: false})
		t("fn type", `let myFnType = fn<int, str, myIntType> str`, {compile: false})
		t("obj type", `
let myObjType = obj{
    int a,
    str b,
}
	`, {compile: false})
	})

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
	`, {compile: false})

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
	`, {compile: false})
})
