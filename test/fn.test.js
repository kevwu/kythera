const t = require("./util").test

describe("Functions", () => {
	t("Anonymous function and call", `
<int a> int {
    let q = 99
    let r = q
    return q
}(10)
	`, {compile: false})

	t("Fibonacci", `
let fibo = <int x> int {
    if x == 1 {
        return 1
    }

    if x == 0 {
        return 0
    }

    return fibo(x-1) + fibo(x-2)
}

fibo(10)
`, {compile: false})

	t("Fizzbuzz and call", `
<int count> null {
    let x = 0
    while x < count {
        if ((x % 3) == 0 && (x % 5) == 0) {
            "fizzbuzz"
        } else if (x % 5) == 0 {
            "buzz"
        } else if (x % 3) == 0 {
            "fizz"
        } else {
            x
        }

        x = x + 1
    }
    return null
}(20)
`, {compile: false})

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