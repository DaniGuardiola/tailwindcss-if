import { type Node, parse } from "./parser.js";

export function buildSelector(
	node: Node,
	conditionMap: Record<string, string>,
	notCount = 0,
	context = "root",
): string {
	switch (node.type) {
		case "binary": {
			const left = buildSelector(
				node.left,
				conditionMap,
				notCount,
				node.operator,
			);
			const right = buildSelector(
				node.right,
				conditionMap,
				notCount,
				node.operator,
			);
			return node.operator === "and"
				? `${left}${right}`
				: `:is(${left}, ${right})`;
		}

		case "unary": {
			if (
				notCount % 2 === 0 &&
				node.operand.type === "binary" &&
				node.operand.operator === "and"
			) {
				// distribute "not" over "and" operands
				const left = buildSelector(node.operand.left, conditionMap, 0, "and");
				const right = buildSelector(node.operand.right, conditionMap, 0, "and");
				return `:not(${left}, ${right})`;
			}
			return buildSelector(node.operand, conditionMap, notCount + 1, "not");
		}

		case "condition": {
			let conditionSelector = conditionMap[node.name];
			if (!conditionSelector) {
				throw new Error(`Unknown condition: ${node.name}`);
			}
			// check if selector starts with alphanumeric character, wrap in `:is()` to "escape it"
			// when concatenating as part of "and"
			if (context === "and" && /^[a-zA-Z0-9]/.test(conditionSelector)) {
				conditionSelector = `:is(${conditionSelector})`;
			}
			// apply `:not()` only if there's an odd number of negations
			return notCount % 2 === 0
				? conditionSelector
				: `:not(${conditionSelector})`;
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
	return buildSelector(ast, conditionMap);
}
