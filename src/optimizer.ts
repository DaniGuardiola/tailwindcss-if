import type { Node } from "./ast.js";

function collapseNestedNot(
	node: Node,
	signal: { dirty: boolean },
	n = 0,
): Node {
	if (n > 1) {
		signal.dirty = true;
	}
	switch (node.type) {
		case "not":
			return collapseNestedNot(node.child, signal, n + 1);
		case "and":
		case "or":
		case "nor": {
			const children = node.children.map((child) =>
				collapseNestedNot(child, signal, 0),
			);
			const andOrNode = { ...node, children };
			return n % 2 === 1 ? { type: "not", child: andOrNode } : andOrNode;
		}
		case "condition":
			return n % 2 === 1 ? { type: "not", child: node } : node;
	}
}

function collapseNestedAndOr(node: Node, signal: { dirty: boolean }): Node {
	switch (node.type) {
		case "and":
		case "or": {
			const children = node.children.flatMap((child) => {
				const flatChild = collapseNestedAndOr(child, signal);
				if (flatChild.type === node.type) {
					signal.dirty = true;
					return flatChild.children;
				}
				return [flatChild];
			});
			return { ...node, children };
		}
		case "nor": {
			const children = node.children.map((child) =>
				collapseNestedAndOr(child, signal),
			);
			return { ...node, children };
		}
		case "not":
			return { ...node, child: collapseNestedAndOr(node.child, signal) };
		case "condition":
			return node;
	}
}

function collapseNotOr(node: Node, signal: { dirty: boolean }): Node {
	switch (node.type) {
		case "not": {
			if (node.child.type === "or") {
				signal.dirty = true;
				return {
					type: "nor",
					children: node.child.children.map((child) =>
						collapseNotOr(child, signal),
					),
				};
			}
			return { ...node, child: collapseNotOr(node.child, signal) };
		}
		case "and":
		case "or":
		case "nor": {
			const children = node.children.map((child) =>
				collapseNotOr(child, signal),
			);
			return { ...node, children };
		}
		case "condition":
			return node;
	}
}

function applyDeMorgan(node: Node, signal: { dirty: boolean }): Node {
	// OR(NOT(a), NOT(b), NOT(c)...) -> NOT(AND(a, b, c...))
	// AND(NOT(a), NOT(b), NOT(c)) -> NOT(OR(a, b, c...))
	// NOR(NOT(a), NOT(b), NOT(c)) -> AND(a, b, c...)
	switch (node.type) {
		case "and":
		case "or": {
			const children = node.children.map((child) =>
				applyDeMorgan(child, signal),
			);
			if (children.every((child) => child.type === "not")) {
				signal.dirty = true;
				return {
					type: "not",
					child: {
						type: node.type === "and" ? "or" : "and",
						children: children.map((child) => {
							if (child.type !== "not") {
								throw new Error(
									"This should never happen. Please report this bug.",
								);
							}
							return child.child;
						}),
					},
				};
			}
			return { ...node, children };
		}
		case "nor": {
			const children = node.children.map((child) =>
				applyDeMorgan(child, signal),
			);
			if (children.every((child) => child.type === "not")) {
				signal.dirty = true;
				return {
					type: "and",
					children: children.map((child) => {
						if (child.type !== "not") {
							throw new Error(
								"This should never happen. Please report this bug.",
							);
						}
						return child.child;
					}),
				};
			}
			return { ...node, children };
		}
		case "not":
			return { ...node, child: applyDeMorgan(node.child, signal) };
		case "condition":
			return node;
	}
}

// TODO: absorption law
// OR(a, AND(a, b)) -> a
// AND(a, OR(a, b)) -> a
// NOR(a, AND(a, b)) -> NOR(a)

// TODO: idempotent law
// OR(a, a) -> a
// AND(a, a) -> a
// NOR(a, a) -> NOT(a)

// TODO: negation law
// OR(a, NOT(a)) -> true
// AND(a, NOT(a)) -> false

// TODO: redundancy law
// OR(a, a, b) -> OR(a, b)
// AND(a, a, b) -> AND(a, b)
// NOR(a, a, b) -> NOR(a, b)

// TODO: distributive law
// OR(AND(a, b), AND(a, c)) -> AND(a, OR(b, c))
// AND(OR(a, b), OR(a, c)) -> OR(a, AND(b, c))
// OR(AND(A, B, C), AND(A, B, D), AND(A, B, E)) -> AND(A, B, OR(C, D, E))
// AND(OR(A, B, C), OR(A, B, D), OR(A, B, E)) -> OR(A, B, AND(C, D, E))

// TODO: merge optimizations into one function for better performance

export function optimize(node: Node) {
	let optimizedNode = node;
	const signal = { dirty: true };
	while (signal.dirty) {
		signal.dirty = false;
		optimizedNode = collapseNestedNot(optimizedNode, signal);
		optimizedNode = collapseNestedAndOr(optimizedNode, signal);
		optimizedNode = collapseNotOr(optimizedNode, signal);
		optimizedNode = applyDeMorgan(optimizedNode, signal);
	}
	return optimizedNode;
}

// TODO: ideas if generalized:
// - add all other gates: NAND, XOR, XNOR
// - make some nodes optional and adapt the optimization to that
