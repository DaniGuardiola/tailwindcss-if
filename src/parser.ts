import { type AndToken, type OrToken, type Token, tokenize } from "./lexer.js";

export type Node =
	| { type: "binary"; operator: "and" | "or"; left: Node; right: Node }
	| { type: "unary"; operator: "not"; operand: Node }
	| { type: "condition"; name: string };

export function constructAst(tokens: Token[]) {
	let current = 0;

	function parseExpression(): Node {
		let node = parsePrimary();

		while (current < tokens.length && isOperator(tokens[current])) {
			node = parseBinary(node);
		}

		return node;
	}

	function parsePrimary(): Node {
		const token = tokens.at(current);
		if (!token) {
			throw new SyntaxError("Unexpected end of expression");
		}

		switch (token.type) {
			case "open-paren": {
				current++;
				const expr = parseExpression();
				expectToken("close-paren");
				checkTokenIsValid(["and", "or", "close-paren"]);
				return expr;
			}
			case "not": {
				current++;
				checkTokenIsValid(["open-paren", "condition"]);
				return { type: "unary", operator: "not", operand: parsePrimary() };
			}
			case "condition": {
				current++;
				checkTokenIsValid(["and", "or", "close-paren"]);
				return { type: "condition", name: token.name };
			}
			default:
				throw new SyntaxError(`Unexpected token: ${token.type}`);
		}
	}

	function parseBinary(left: Node): Node {
		const token = tokens[current];
		if (!isOperator(token)) {
			throw new SyntaxError("Expected operator");
		}
		const operator = token.type;
		current++;
		checkTokenIsValid(["open-paren", "condition", "not"]);
		const right = parsePrimary();

		return { type: "binary", operator, left, right };
	}

	function checkTokenIsValid(allowedTypes: string[]) {
		if (tokens[current] && !allowedTypes.includes(tokens[current].type)) {
			throw new SyntaxError(
				`Expected one of '${allowedTypes.join(", ")}', found ${
					tokens[current].type
				}`,
			);
		}
	}

	function expectToken(type: string) {
		if (tokens[current]?.type === type) {
			current++;
		} else {
			throw new SyntaxError(
				`Expected ${type}, found ${
					tokens[current]?.type ?? "end of expression"
				}`,
			);
		}
	}

	function isOperator(token: Token): token is AndToken | OrToken {
		return token.type === "and" || token.type === "or";
	}

	const ast = parseExpression();

	if (current !== tokens.length) {
		throw new SyntaxError(
			`Unexpected token: ${tokens[current].type} at position ${current}`,
		);
	}

	return ast;
}

export function parse(input: string) {
	const tokens = tokenize(input);
	return constructAst(tokens);
}
