import type { Node } from "./ast.js";
import { type AndToken, type OrToken, type Token, tokenize } from "./lexer.js";

export function constructAst(tokens: Token[]) {
	let current = 0;

	function parseExpression(): Node {
		let node = parsePrimary();

		while (current < tokens.length && isOperator(getToken())) {
			node = parseBinary(node);
		}

		return node;
	}

	function parsePrimary(): Node {
		const token = getToken();

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
				return { type: "not", child: parsePrimary() };
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
		const token = getToken();
		if (!isOperator(token)) {
			throw new SyntaxError(`Unexpected token: ${token.type}`);
		}
		const operator = token.type;
		current++;
		checkTokenIsValid(["open-paren", "condition", "not"]);
		const right = parsePrimary();

		return { type: operator, children: [left, right] };
	}

	function getToken() {
		const token = tokens.at(current);
		if (!token) {
			throw new SyntaxError("Unexpected end of expression");
		}
		return token;
	}

	function checkTokenIsValid(allowedTypes: string[]) {
		const token = tokens.at(current);
		if (token && !allowedTypes.includes(token.type)) {
			throw new SyntaxError(
				`Unexpected token: ${token.type}, expected one of: ${allowedTypes.join(
					", ",
				)}`,
			);
		}
	}

	function expectToken(type: string) {
		const token = getToken();
		if (token.type === type) {
			current++;
		} else {
			throw new SyntaxError(`Expected ${type}, found ${token.type}`);
		}
	}

	function isOperator(token: Token): token is AndToken | OrToken {
		return token.type === "and" || token.type === "or";
	}

	const ast = parseExpression();

	const extraToken = tokens.at(current);
	if (extraToken) {
		throw new SyntaxError(`Unexpected token: ${extraToken.type}`);
	}

	return ast;
}

export function parse(input: string) {
	const tokens = tokenize(input);
	return constructAst(tokens);
}
