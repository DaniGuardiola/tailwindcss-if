import type { AndNode, Node, NotNode, OrNode } from "../ast.js";

function toOptNode(node: Node | string): Node {
	if (typeof node === "string") {
		return { type: "condition", name: node };
	}
	return node;
}

export function or(...nodes: (Node | string)[]): OrNode {
	return { type: "or", children: nodes.map(toOptNode) };
}

export function and(...nodes: (Node | string)[]): AndNode {
	return { type: "and", children: nodes.map(toOptNode) };
}

export function not(node: Node | string): NotNode {
	return { type: "not", child: toOptNode(node) };
}
