import { expect } from "bun:test";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

import {
	type TailwindIfOptions as IfVariantsOptions,
	ifVariants,
} from "../index.js";
import { parse } from "../parser.js";
import { buildSelector } from "../selector-builder.js";

const CONDITIONS_SIMPLE = {
	linux: ".linux",
	mac: ".mac",
	win: ".win",
};

const CONDITIONS_COMPLEX = {
	linux: ".platform-linux",
	mac: "[data-platform-mac]",
	win: "body.is-windows",
};

async function compile(
	classes: string,
	options: Partial<IfVariantsOptions> = {},
) {
	const input = `.test{@apply ${classes};}`;
	let result: string;
	try {
		const postcssResult = await postcss([
			tailwindcss({
				config: {
					content: ["fake.html"],
					plugins: [ifVariants({ conditions: CONDITIONS_COMPLEX, ...options })],
				},
			}),
		]).process(input, { from: "test.css" });
		result = postcssResult.css;
	} catch (error) {
		result = `${error}`;
	}
	return result;
}

export async function expectCss(
	classes: string,
	options: Partial<IfVariantsOptions> = {},
) {
	const css = await compile(classes, options);
	expect({ _: classes, css }).toMatchSnapshot();
}

function testParse(input: string) {
	let result: any;
	try {
		result = parse(input);
	} catch (error) {
		result = `${error}`;
	}
	return result;
}

export function expectParse(expression: string) {
	expect({
		_: expression,
		ast: testParse(expression),
	}).toMatchSnapshot();
}

export function expectSelector(expression: string, complex = false) {
	expect({
		_: expression,
		selector: buildSelector(
			parse(expression),
			complex ? CONDITIONS_COMPLEX : CONDITIONS_SIMPLE,
		),
	}).toMatchSnapshot();
}
