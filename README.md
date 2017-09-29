# kythera

This repository contains a JavaScript parser for the Kythera programming language. The current plan is to build a source-to-source compiler to JavaScript. The old ANTLR implementation, which includes a partially working interpreter, can be found [here](https://github.com/kevwu/kythera). An in-progress overview of the language can be found [here](https://dejawu.nanote.co/n/kythera).

## About Kythera

Kythera (kith-eer-ah) is a strongly, statically typed programming language. It's built with the following ideas in mind:

- There should be minimal "magic". What the code appears to do at first glance *to someone unfamiliar with the language* should be close to what the code is actually doing.
- The language must be divorced from its environment. Kythera will first run in compiled JavaScript but may someday be compiled to machine code for many targets.
- The core language itself must be small and compact. The user should be able to keep a working knowledge of the entire language in their head. As much functionality as possible should be moved to the standard library (e.g. int-float conversion)
- Explicit behavior at the cost of verbosity is always better than implied behavior for the sake of brevity.

Kythera is named after [the Antikythera Mechanism](https://en.wikipedia.org/wiki/Antikythera_mechanism), and is also the name of a Greek island. It joins Kotlin and Java in the hallowed society of programming languages named after islands. Because most programming languages do not make it past infancy, I consider a cool name to be a key feature of Kythera.
