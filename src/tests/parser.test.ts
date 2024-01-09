import { test } from "bun:test";

import { expectParse } from "./utils.js";

test("valid simple expressions", () => {
	expectParse("linux");
	expectParse("(linux)");
	expectParse("!mac");
	expectParse("(!mac)");
	expectParse("!(mac)");
	expectParse("((mac))");
	expectParse("((!(mac)))");
	expectParse("(!(!(mac)))");
	expectParse("!(!(!(mac)))");
	expectParse("!(!(!(!mac)))");
	expectParse("(((linux)))");
	expectParse("!(!(!(!(!mac))))");
	expectParse("!(!linux)");
});

test("invalid simple expressions", () => {
	expectParse("linux!");
	expectParse("(linux!)");
	expectParse("(linux)!");
	expectParse("mac!linux");
	expectParse("(mac)linux");
	expectParse("mac!(linux)");
	expectParse("!!mac");
	expectParse("()");
	expectParse("(mac))");
	expectParse("(mac))linux");
	expectParse("(mac))hello!123");
	expectParse("((mac)");
	expectParse("(((mac)");
	expectParse("mac))");
	expectParse("linux#");
	expectParse("ma(c)");
	expectParse("");
	expectParse("(");
	expectParse(")");
	expectParse("!");
	expectParse("&");
	expectParse("|");
	expectParse("linux&");
	expectParse("linux|");
	expectParse("&linux");
	expectParse("|linux");
	expectParse(" ( linux ) ");
	expectParse("mac linux");
	expectParse("((linux))()");
	expectParse("(()linux)");
	expectParse("(linux))(");
	expectParse("!!!");
	expectParse("&&&");
	expectParse("|||");
	expectParse("!!!linux");
	expectParse("!!!(!!!linux)");
});

test("valid complex expressions", () => {
	expectParse("linux&!mac");
	expectParse("linux&!mac&win");
	expectParse("linux&!mac&win&!win");
	expectParse("(linux&!mac)");
	expectParse("linux&(!mac)");
	expectParse("(linux)&(!mac)");
	expectParse("(linux&!mac)&win");
	expectParse("linux&(!mac&win)");
	expectParse("(linux&!mac)&(win)");
	expectParse("(linux)&(!mac&win)");
	expectParse("(linux)&(!mac)&(win)");
	expectParse("((linux)&(!mac)&(win))");
	expectParse("linux&mac|win");
	expectParse("linux&(mac|win)");
	expectParse("(linux|mac)&win");
	expectParse("((linux&mac)|(!win&linux))");
	expectParse("((linux&(!mac))&((win|linux)))");
	expectParse("!linux&!mac");
	expectParse("(linux|!mac)&win");
	expectParse("!(!linux&mac)|win");
	expectParse("((linux|mac)&(!win|linux))&win");
});

test("invalid complex expressions", () => {
	expectParse("linux&|mac");
	expectParse("linux&&mac");
	expectParse("&|");
	expectParse("&&||");
	expectParse("(linux&mac");
	expectParse("linux&mac))");
	expectParse("linux&");
	expectParse("&mac");
	expectParse("linux||");
	expectParse("linux&");
	expectParse("&mac");
	expectParse("linux||");
	expectParse("((linux&mac");
	expectParse("linux&mac))");
	expectParse("(linux|mac)&(win");
});

test("mixed valid and invalid expressions", () => {
	expectParse("linux&(mac");
	expectParse("!(linux&mac))");
	expectParse("linux&(mac!)");
	expectParse("(linux&!mac)|win)");
});

test("edge case expressions", () => {
	expectParse("a");
	expectParse("!b");
	expectParse("thisIsAVeryLongConditionName");
	expectParse("!thisIsAnotherVeryLongConditionName");
	expectParse("condition123");
	expectParse("123condition");
	expectParse("linux&mac|win");
});
