import { test } from "bun:test";

import { expectSelector } from "./utils.js";

test("simple expressions", () => {
	expectSelector("linux");
	expectSelector("(linux)");
	expectSelector("!mac");
	expectSelector("(!mac)");
	expectSelector("!(mac)");
	expectSelector("((mac))");
	expectSelector("((!(mac)))");
	expectSelector("(!(!(mac)))");
	expectSelector("!(!(!(mac)))");
	expectSelector("!(!(!(!mac)))");
	expectSelector("(((linux)))");
	expectSelector("!(!(!(!(!mac))))");
	expectSelector("!(!linux)");
});

test("complex expressions", () => {
	expectSelector("linux&!mac");
	expectSelector("linux&!mac&win");
	expectSelector("linux&!mac&win&!win");
	expectSelector("(linux&!mac)");
	expectSelector("linux&(!mac)");
	expectSelector("(linux)&(!mac)");
	expectSelector("(linux&!mac)&win");
	expectSelector("linux&(!mac&win)");
	expectSelector("(linux&!mac)&(win)");
	expectSelector("(linux)&(!mac&win)");
	expectSelector("(linux)&(!mac)&(win)");
	expectSelector("((linux)&(!mac)&(win))");
	expectSelector("linux&mac|win");
	expectSelector("linux&(mac|win)");
	expectSelector("(linux|mac)&win");
	expectSelector("((linux&mac)|(!win&linux))");
	expectSelector("((linux&(!mac))&((win|linux)))");
	expectSelector("!linux&!mac");
	expectSelector("(linux|!mac)&win");
	expectSelector("!(!linux&mac)|win");
	expectSelector("((linux|mac)&(!win|linux))&win");
});

test("unary collapsing", () => {
	expectSelector("!(linux&mac)");
	expectSelector("!(linux&mac&win)");
	expectSelector("!(linux&!mac)");
	expectSelector("!(!linux&mac)");
	expectSelector("!(!linux&!mac)");
	expectSelector("!(!(linux&mac))");
	expectSelector("!(!(linux&mac&win))");
	expectSelector("!(!(linux&!mac))");
	expectSelector("!(!(!linux&mac))");
	expectSelector("!(!(!linux&!mac))");
	expectSelector("!(linux|mac)");
	expectSelector("!(linux|mac|win)");
	expectSelector("!(linux|!mac)");
	expectSelector("!(!linux|mac)");
	expectSelector("!(!linux|!mac)");
	expectSelector("!(!(linux|mac))");
	expectSelector("!(!(linux|mac|win))");
	expectSelector("!(!(linux|!mac))");
	expectSelector("!(!(!linux|mac))");
	expectSelector("!(!(!linux|!mac))");
});

test("binary collapsing", () => {
	expectSelector("!(!linux&!mac)");
	expectSelector("!(!linux&!mac&!win)");
	expectSelector("!(!linux|!mac)");
	expectSelector("!(!linux|!mac|!win)");
	expectSelector("!(!linux&!mac)");
	expectSelector("!(!linux&!mac&!win)");
	expectSelector("!(!linux|!mac)");
	expectSelector("!(!linux|!mac|!win)");
});

test("wrapped selectors", () => {
	expectSelector("linux|win", true);
	expectSelector("linux&win", true);
	expectSelector("win", true);
	expectSelector("!win", true);
});
