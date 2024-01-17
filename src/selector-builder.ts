import type { Node } from "./ast.js";
import { optimize } from "./optimizer.js";
import { parse } from "./parser.js";

const CSS_IDENTIFIER_START_REGEXP = /^-?[_a-zA-Z0-9-]+/;

export function buildSelector(
	node: Node,
	conditionMap: Record<string, string>,
	context: Node["type"] | "root" = "root",
): string {
	switch (node.type) {
		case "and":
		case "or":
		// biome-ignore lint/suspicious/noFallthroughSwitchClause: Biome doesn't have type information to determine that this doesn't actually fall through.
		case "nor": {
			const children = node.children.map((child) =>
				buildSelector(child, conditionMap, node.type),
			);
			switch (node.type) {
				case "and":
					return children.join("");
				case "or":
					return `:is(${children.join(", ")})`;
				case "nor":
					return `:not(${children.join(", ")})`;
			}
		}

		case "not":
			return `:not(${buildSelector(node.child, conditionMap, "not")})`;

		case "condition": {
			const conditionSelector = conditionMap[node.name];
			if (!conditionSelector) {
				throw new Error(`Unknown condition: ${node.name}`);
			}
			// check if selector starts with a CSS identifier character, wrap in `:is()`
			// to "escape it" when concatenating as part of "and"
			if (
				context === "and" &&
				CSS_IDENTIFIER_START_REGEXP.test(conditionSelector)
			) {
				return `:is(${conditionSelector})`;
			}
			return conditionSelector;
		}

		default:
			throw new Error(`Unknown node type: ${(node as any).type}`);
	}
}

export function toSelector(
	expression: string,
	conditionMap: Record<string, string>,
) {
	const ast = parse(expression);
	return buildSelector(optimize(ast), conditionMap);
}

// TODO: instead of this naive approach, create an "intermediate representation"
// that can be looped over to optimize and normalize until no nodes are dirty,
// then "render" to CSS selector

// pros:
// - easier to debug
// - unlocks more optimizations and they are easier to implement
// - more likely to be correct
// cons:
// - more complex setup (though it makes optimizations easier to implement)
// - probably slower
