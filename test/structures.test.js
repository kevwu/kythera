const t = require("./util").test

describe("Structures (obj and list)", () => {
	t("Object access", "", {skip: true})
	t("Object insertion", "", {skip: true})
	t("Array access", `
let myAr = [1, 2, 3, 4]
let r = myAr[1]
`)
	t("Array insertion", "", {skip: true})
})