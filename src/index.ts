import plugin from "tailwindcss/plugin.js";

import { parse } from "./parser.js";
import { buildSelector } from "./selector-builder.js";

/**
 * Options for the `ifVariants` plugin.
 */
export type TailwindIfOptions = {
	/**
	 * A map of condition names to selectors.
	 *
	 * Condition names are used as variants. For example, if a property is `"win"` and its
	 * value is `".platform-windows"`, the `win:` and `not-win:` variants will be available.
	 * Condition names can also be used in `if-[]:` variant expressions, for example
	 * `if-[win|mac]:`. The output selector will be based on the value provided, for
	 * example `not-win:` will result in `:not(.platform-windows) &`.
	 */
	conditions: Record<string, string>;

	/**
	 * Whether to wrap condition selectors in `:where()` to give them a specificity value of 0.
	 * @default false
	 */
	weakSpecificity?: boolean;
};

/**
 * A Tailwind CSS plugin that lets you use "conditions" as variants.
 *
 * For example, in a desktop app (e.g. Electron), you might want to have different styles
 * depending on the platform. Using this plugin, you can do the following:
 *
 * 1. Expose the value of the conditions in a parent DOM element, like `<html>` or the body.
 * It is important that all values are set in the same element. Values can be set as classes
 * (e.g. `.platform-linux`), attributes (e.g. `[data-platform="linux"]`), or anything else
 * that could be targeted with a CSS selector.
 *
 * 2. Use the plugin in your Tailwind CSS config, and pass it the `conditions` option, which
 * is a map of condition names to selectors. For example, you can set a property `"win"` with
 * a value of `".platform-windows"`. This will make add the `win:` and `not-win:` variants,
 * as well as making the condition available in `if-[]:` variant expressions, for example
 * `if-[win|mac]:`.
 *
 * 3. Use the variants! Some examples:
 *    - Hide something on Windows: `win:hidden`.
 *    - Hide something for all platforms except Linux: `not-linux:hidden`.
 *    - Make something bold on macOS and Windows: `if-[mac|win]:font-bold`.
 *
 * The `if-[]:` variant supports:
 *
 *   - Negation: `if-[!win]:`.
 *   - Conjunction ("and"): `if-[win&mac]:`.
 *   - Disjunction ("or"): `if-[win|mac]:`.
 *   - Parentheses for grouping: `if-[win|(mac&!linux)]:`.
 *   - Any combination of the above, for any number of conditions and levels of nesting.
 *
 * The operator precedence is left-to-right by default, but you can use parentheses to
 * override it.
 */
export const ifVariants = plugin.withOptions<TailwindIfOptions>(
	({ conditions, weakSpecificity = false }) => {
		function withSpecificity(selector: string) {
			return weakSpecificity ? `:where(${selector})` : selector;
		}
		return ({ addVariant, matchVariant }) => {
			for (const [name, selector] of Object.entries(conditions)) {
				addVariant(name, `${withSpecificity(selector)} &`);
				addVariant(`not-${name}`, `${withSpecificity(`:not(${selector})`)} &`);
			}

			matchVariant("if", (value) => {
				try {
					const ast = parse(value);
					const selector = buildSelector(ast, conditions);
					return `${withSpecificity(selector)} &`;
				} catch (_) {
					return [];
				}
			});
		};
	},
);
