import { test } from "bun:test";

import { and, not, or } from "./utils-optimization.js";
import { expectOptimization } from "./utils.js";

test("optimization: collapse and/or", () => {
	expectOptimization(and("a", "b"));
	expectOptimization(or("a", "b"));
	expectOptimization(and(and("a", "b"), "c"));
	expectOptimization(and("a", and("b", "c")));
	expectOptimization(and("a", or("b", "c")));
	expectOptimization(or("a", or("b", "c")));
	expectOptimization(or("a", and("b", "c")));
	expectOptimization(and("a", and("b", and("c", "d"))));
	expectOptimization(and("a", and("b", or("c", "d"))));
	expectOptimization(and("a", or("b", and("c", "d"))));
	expectOptimization(and("a", or("b", or("c", "d"))));
	expectOptimization(or("a", and("b", and("c", "d"))));
	expectOptimization(or("a", and("b", or("c", "d"))));
	expectOptimization(or("a", or("b", and("c", "d"))));
	expectOptimization(or("a", or("b", or("c", "d"))));
});

test("optimization: collapse not", () => {
	expectOptimization(not("a"));
	expectOptimization(not(not("a")));
	expectOptimization(not(not(not("a"))));
	expectOptimization(not(not(not(not("a")))));
	expectOptimization(not(not(not(not(not("a"))))));
	expectOptimization(not(not(not(not(not(not("a")))))));
	expectOptimization(not(not(not(not(not(not(not("a"))))))));
	expectOptimization(not(not(not(not(not(not(not(not("a")))))))));
});

test("optimization: collapse and/or + not", () => {
	expectOptimization(not(and("a", "b")));
	expectOptimization(not(and(and("a", "b"), "c")));
	expectOptimization(not(and("a", and("b", "c"))));
	expectOptimization(not(or("a", "b")));
	expectOptimization(not(or(or("a", "b"), "c")));
	expectOptimization(not(or("a", or("b", "c"))));
	expectOptimization(not(not(and("a", "b"))));
	expectOptimization(not(not(or("a", "b"))));
	expectOptimization(not(and("a", not("c"))));
	expectOptimization(not(not(and("a", not("c")))));
	expectOptimization(not(or("a", not("c"))));
	expectOptimization(not(not(or("a", not("c")))));
	expectOptimization(not(and(not(not(and("a", "b"))), "c")));
	expectOptimization(not(or(not(not(or("a", "b"))), "c")));
	expectOptimization(not(and(not(not(and("a", not("b")))), "c")));
	expectOptimization(not(or(not(not(or("a", not("b")))), "c")));
});

test("optimization: collapse not(or())", () => {
	expectOptimization(not(or("a", "b")));
	expectOptimization(not(or(or("a", "b"), "c")));
	expectOptimization(not(or("a", or("b", "c"))));
	expectOptimization(not(not(or("a", "b"))));
	expectOptimization(not(not(or(or("a", "b"), "c"))));
	expectOptimization(not(not(or("a", or("b", "c")))));
	expectOptimization(not(not(not(or("a", "b")))));
	expectOptimization(not(not(not(or(or("a", "b"), "c")))));
	expectOptimization(not(or("a", not(not(or("b", "c"))))));
});

test("optimization: apply De Morgan", () => {
	// OR(NOT(a), NOT(b), NOT(c)...) -> NOT(AND(a, b, c...))
	// AND(NOT(a), NOT(b), NOT(c)) -> NOT(OR(a, b, c...))
	expectOptimization(or(not("a"), not("b"), not("c")));
	expectOptimization(not(or(not("a"), not("b"), not("c"))));
	expectOptimization(and(not("a"), not("b"), not("c")));
	expectOptimization(not(and(not("a"), not("b"), not("c"))));
	expectOptimization(or(not("a"), not("b"), not("c"), not("d")));
	expectOptimization(not(or(not("a"), not("b"), not("c"), not("d"))));
	expectOptimization(and(not("a"), not("b"), not("c"), not("d")));
	expectOptimization(not(and(not("a"), not("b"), not("c"), not("d"))));
	expectOptimization(or(not(not("a")), not(not("b")), not(not("c"))));
	expectOptimization(not(or(not(not("a")), not(not("b")), not(not("c")))));
	expectOptimization(and(not(not("a")), not(not("b")), not(not("c"))));
	expectOptimization(not(and(not(not("a")), not(not("b")), not(not("c")))));
	expectOptimization(
		or(not(not("a")), not(not("b")), not(not("c")), not(not("d"))),
	);
	expectOptimization(
		not(or(not(not("a")), not(not("b")), not(not("c")), not(not("d")))),
	);
});
