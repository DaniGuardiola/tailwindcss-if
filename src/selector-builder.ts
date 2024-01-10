import {
	type AndNode,
	type BinaryNode,
	type Node,
	type OrNode,
	type UnaryNode,
	parse,
} from "./parser.js";

const CSS_IDENTIFIER_START_REGEXP = /^-?[_a-zA-Z]+/;

function isBinaryOfUnaries(node: BinaryNode): node is BinaryNode & {
	left: UnaryNode;
	right: UnaryNode;
} {
	return (
		node.left.type === "unary" &&
		node.left.operator === "not" &&
		node.right.type === "unary" &&
		node.right.operator === "not"
	);
}

function collapseAndOfUnaries(
	node: AndNode & {
		left: UnaryNode;
		right: UnaryNode;
	},
	conditionMap: Record<string, string>,
	isNegated: boolean,
) {
	// - distribute "not" over "and"
	// not(a) and not(b) -> not (a or b)
	// :not(.a):not(.b) -> :not(.a, .b)
	// - negated
	// not(not(a) and not(b)) -> a or b
	// :not(:not(.a):not(.b)) -> :is(.a, .b)
	const left = buildSelector(
		node.left.operand,
		conditionMap,
		0,
		isNegated ? "or" : "not",
	);
	const right = buildSelector(
		node.right.operand,
		conditionMap,
		0,
		isNegated ? "or" : "not",
	);
	return isNegated ? `:is(${left}, ${right})` : `:not(${left}, ${right})`;
}

function collapseOrOfUnaries(
	node: OrNode & {
		left: UnaryNode;
		right: UnaryNode;
	},
	conditionMap: Record<string, string>,
	isNegated: boolean,
) {
	// - distribute "not" over "or"
	// not(a) or not(b)) -> not(a and b)
	// :is(:not(.a), :not(.b)) -> :not(.a.b)
	// - negated
	// not(not(a) or not(b)) -> a and b
	// :not(:is(:not(.a), :not(.b))) -> .a.b
	const left = buildSelector(node.left.operand, conditionMap, 0, "and");
	const right = buildSelector(node.right.operand, conditionMap, 0, "and");
	return isNegated ? `${left}${right}` : `:not(${left}${right})`;
}

function collapseBinary(
	node: BinaryNode,
	conditionMap: Record<string, string>,
	notCount: number,
) {
	const isNegated = notCount % 2 === 1;
	if (isBinaryOfUnaries(node)) {
		if (node.operator === "and") {
			return collapseAndOfUnaries(node, conditionMap, isNegated);
		}
		if (node.operator === "or") {
			return collapseOrOfUnaries(node, conditionMap, isNegated);
		}
	}

	return false;
}

function isUnaryBinary(node: UnaryNode): node is UnaryNode & {
	operand: BinaryNode;
} {
	return node.operand.type === "binary";
}

function isUnaryAnd(
	node: UnaryNode & { operand: BinaryNode },
): node is UnaryNode & {
	operand: AndNode;
} {
	return node.operand.operator === "and";
}

function isUnaryOr(
	node: UnaryNode & { operand: BinaryNode },
): node is UnaryNode & {
	operand: OrNode;
} {
	return node.operand.operator === "or";
}

function collapseUnaryAnd(
	node: UnaryNode & { operand: AndNode },
	conditionMap: Record<string, string>,
	isNegated: boolean,
) {
	// - collapse "not" for "and"
	// not(a and b) -> not(a and b)
	// :not(.a.b) -> :not(.a.b)
	// - negated
	// not(not(a and b)) -> a and b
	// :not(:not(.a.b)) -> .a.b
	const left = buildSelector(node.operand.left, conditionMap, 0, "and");
	const right = buildSelector(node.operand.right, conditionMap, 0, "and");
	return isNegated ? `${left}${right}` : `:not(${left}${right})`;
}

function collapseUnaryOr(
	node: UnaryNode & { operand: OrNode },
	conditionMap: Record<string, string>,
	isNegated: boolean,
) {
	// - collapse "not" for "or"
	// not(a or b) -> not(a or b)
	// :not(:is(.a, .b)) -> :not(.a, .b)
	// - negated
	// not(not(a or b)) -> a or b
	// :not(:not(:is(.a, .b))) -> :is(.a, .b)
	const left = buildSelector(
		node.operand.left,
		conditionMap,
		0,
		isNegated ? "and" : "not",
	);
	const right = buildSelector(
		node.operand.right,
		conditionMap,
		0,
		isNegated ? "or" : "not",
	);
	return isNegated ? `:is(${left}, ${right})` : `:not(${left}, ${right})`;
}

function collapseUnary(
	node: UnaryNode,
	conditionMap: Record<string, string>,
	notCount: number,
) {
	const isNegated = notCount % 2 === 1;
	if (isUnaryBinary(node)) {
		if (isUnaryAnd(node)) {
			return collapseUnaryAnd(node, conditionMap, isNegated);
		}
		if (isUnaryOr(node)) {
			return collapseUnaryOr(node, conditionMap, isNegated);
		}
	}

	return false;
}

export function buildSelector(
	node: Node,
	conditionMap: Record<string, string>,
	notCount = 0,
	context = "root",
): string {
	switch (node.type) {
		case "binary": {
			const collapsed = collapseBinary(node, conditionMap, notCount);
			if (collapsed) {
				return collapsed;
			}
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
			const collapsed = collapseUnary(node, conditionMap, notCount);
			if (collapsed) {
				return collapsed;
			}
			return buildSelector(node.operand, conditionMap, notCount + 1, "not");
		}

		case "condition": {
			let conditionSelector = conditionMap[node.name];
			if (!conditionSelector) {
				throw new Error(`Unknown condition: ${node.name}`);
			}
			// check if selector starts with a CSS identifier character, wrap in `:is()`
			// to "escape it" when concatenating as part of "and"
			if (
				context === "and" &&
				CSS_IDENTIFIER_START_REGEXP.test(conditionSelector)
			) {
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
