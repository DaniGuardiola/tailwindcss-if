export type AndNode = {
	type: "and";
	children: Node[];
};
export type OrNode = {
	type: "or";
	children: Node[];
};
export type NotNode = { type: "not"; child: Node };
export type NorNode = { type: "nor"; children: Node[] };
export type ConditionNode = { type: "condition"; name: string };

export type Node = AndNode | OrNode | NotNode | NorNode | ConditionNode;
