const t = require("./util").test

describe("Control flow", () => {
	describe("if", () => {
		t("if", `
if false {
	a
}	
	`, {compile: false})

		t("if-else", `
if false {
    a
} else {
    b
}	
	`, {compile: false})

		t("if-else-if", `
if false {
    a
} else if false {
    23
} else {
    "yay"
}	
	`, {compile: false})

		t("if-else with boolean", `
if a == b {
    a
} else {
    b
}	
	`, {compile: false})

		t("if-else-if with boolean", `
if a == b {
	a
} else if b == c {
	23
} else {
	"hello"
}	
	`, {compile: false})

	})

	describe("while", () => {
		t("while", `
while a == b {
    a = a + 2
}	
	`, {compile: false})

		t("while", `
let x = 0
while x < 10 {
    x = x + 1
}

x	
	`, {compile: false})
	})
})