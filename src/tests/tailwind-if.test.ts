import { test } from "bun:test";

import { expectCss } from "./utils.js";

test("static variants: simple conditions", async () => {
	await expectCss("linux:italic mac:block win:hidden");
});

test("static variants: simple negated conditions", async () => {
	await expectCss("not-linux:italic not-mac:block not-win:hidden");
});

test("static variants: combined simple conditions", async () => {
	await expectCss("not-linux:not-mac:underline win:linux:line-through");
});

test("static variants: invalid conditions", async () => {
	await expectCss("mac:fridge:line-through win:gba:underline");
});

test("dynamic variants: simple expressions", async () => {
	await expectCss("if-[linux]:italic");
	await expectCss("if-[(linux)]:italic");
	await expectCss("if-[!mac]:italic");
	await expectCss("if-[(!mac)]:italic");
	await expectCss("if-[!(mac)]:italic");
	await expectCss("if-[(mac)]:italic");
	await expectCss("if-[(mac)]:italic");
	await expectCss("if-[(!(!(mac)))]:italic");
	await expectCss("if-[!(!(!(mac)))]:italic");
	await expectCss("if-[!(!(!(!mac)))]:italic");
	await expectCss("if-[(((linux)))]:italic");
	await expectCss("if-[!(!(!(!(!mac))))]:italic");
	await expectCss("if-[!(!linux)]:italic");
});

test("dynamic variants: complex expressions", async () => {
	await expectCss("if-[linux&!mac]:italic");
	await expectCss("if-[linux&!mac&win]:italic");
	await expectCss("if-[linux&!mac&win&!win]:italic");
	await expectCss("if-[(linux&!mac)]:italic");
	await expectCss("if-[linux&(!mac)]:italic");
	await expectCss("if-[(linux)&(!mac)]:italic");
	await expectCss("if-[(linux&!mac)&win]:italic");
	await expectCss("if-[linux&(!mac&win)]:italic");
	await expectCss("if-[(linux&!mac)&(win)]:italic");
	await expectCss("if-[(linux)&(!mac&win)]:italic");
	await expectCss("if-[(linux)&(!mac)&(win)]:italic");
	await expectCss("if-[((linux)&(!mac)&(win))]:italic");
	await expectCss("if-[linux&mac|win]:italic");
	await expectCss("if-[linux&(mac|win)]:italic");
	await expectCss("if-[(linux|mac)&win]:italic");
	await expectCss("if-[((linux&mac)|(!win&linux))]:italic");
	await expectCss("if-[((linux&(!mac))&((win|linux)))]:italic");
	await expectCss("if-[!linux&!mac]:italic");
	await expectCss("if-[(linux|!mac)&win]:italic");
	await expectCss("if-[!(!linux&mac)|win]:italic");
	await expectCss("if-[((linux|mac)&(!win|linux))&win]:italic");
});

test("dynamic variants: 'not' distributed over 'and'", async () => {
	await expectCss("if-[!(linux&mac)]:italic");
	await expectCss("if-[!(linux&mac&win)]:italic");
	await expectCss("if-[!(linux&!mac)]:italic");
	await expectCss("if-[!(!linux&mac)]:italic");
	await expectCss("if-[!(!(linux&mac))]:italic");
	await expectCss("if-[!(!(!linux&mac))]:italic");
	await expectCss("if-[!(linux&mac)|win]:italic");
	await expectCss("if-[!(linux|(mac&win))]:italic");
	await expectCss("if-[!(linux&mac)|!(win&mac)]:italic");
	await expectCss("if-[!((linux&mac)|(win&mac))]:italic");
	await expectCss("if-[!((!linux&mac)|!(!win&mac))]:italic");
});

test("dynamic variants: wrapped selectors", async () => {
	await expectCss("if-[linux|win]:italic");
	await expectCss("if-[linux&win]:italic");
	await expectCss("if-[win]:italic");
	await expectCss("if-[!win]:italic");
});

test("dynamic variants: unknown conditions", async () => {
	await expectCss("if-[unknown]:italic");
	await expectCss("if-[win|unknown]:italic");
});

test("weak specificity", async () => {
	await expectCss("linux:italic mac:block win:hidden");
	await expectCss("linux:italic mac:block win:hidden", {
		weakSpecificity: false,
	});
	await expectCss("linux:italic mac:block win:hidden", {
		weakSpecificity: true,
	});
	await expectCss("not-linux:italic not-mac:block not-win:hidden");
	await expectCss("not-linux:italic not-mac:block not-win:hidden", {
		weakSpecificity: false,
	});
	await expectCss("not-linux:italic not-mac:block not-win:hidden", {
		weakSpecificity: true,
	});
	await expectCss("if-[((linux&mac)|(!win&linux))]:italic");
	await expectCss("if-[((linux&mac)|(!win&linux))]:italic", {
		weakSpecificity: false,
	});
	await expectCss("if-[((linux&mac)|(!win&linux))]:italic", {
		weakSpecificity: true,
	});
});
