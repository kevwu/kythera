const t = require("./util").test

describe("Functions", () => {
	t("Anonymous function and call", `
let res = <int a> int {
    let q = 99
    let r = q
    return q
}(10)
	`)

	t("Anonymous function modifying parameter", `
let res = <int a> int {
	return a + 10
}(5)
	`)

	t("Fibonacci", `
let fibo = new fn<int> int
fibo = <int x> int {
    if x == 1 {
        return 1
    }

    if x == 0 {
        return 0
    }

    return fibo(x-1) + fibo(x-2)
}

let res = fibo(10)
`)

	t("Fizzbuzz and call", `
let fb = new str
<int count> null {
    let x = 0
    while x < count {
        if ((x % 3) == 0 && (x % 5) == 0) {
            fb += "fizzbuzz"
        } else if (x % 5) == 0 {
            fb += "buzz"
        } else if (x % 3) == 0 {
            fb += "fizz"
        } else {
            x // int to str conversion not implemented yet
        }

        x = x + 1
    }
    return null
}(20)
`)

	t("Function with no parameters", `
let nullFn = <> null {
	return null
}
`)
	t("Function with no parameters (with space)", `
let nullFn = < > null {
	return null
}
	`)
})