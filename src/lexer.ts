export type OpenParenToken = { type: "open-paren" }; // (
export type CloseParenToken = { type: "close-paren" }; // )
export type NotToken = { type: "not" }; // !
export type AndToken = { type: "and" }; // &
export type OrToken = { type: "or" }; // |
export type ConditionToken = { type: "condition"; name: string }; // [a-zA-Z-]+

const CONDITION_REGEXP = /^[a-zA-Z0-9-]$/;

export type Token =
	| OpenParenToken
	| CloseParenToken
	| NotToken
	| AndToken
	| OrToken
	| ConditionToken;

export function tokenize(input: string) {
	if (input.length === 0) {
		throw new SyntaxError("Empty expression");
	}

	const tokens: Token[] = [];
	let conditionBuffer = "";

	function tryPushCondition() {
		if (conditionBuffer.length > 0) {
			tokens.push({ type: "condition", name: conditionBuffer });
			conditionBuffer = "";
		}
	}

	for (const char of input) {
		if (CONDITION_REGEXP.test(char)) {
			conditionBuffer += char;
		} else {
			tryPushCondition();
			switch (char) {
				case "(": {
					tokens.push({ type: "open-paren" });
					break;
				}
				case ")": {
					tokens.push({ type: "close-paren" });
					break;
				}
				case "!": {
					tokens.push({ type: "not" });
					break;
				}
				case "&": {
					tokens.push({ type: "and" });
					break;
				}
				case "|": {
					tokens.push({ type: "or" });
					break;
				}
				default:
					throw new SyntaxError(`Unexpected character: ${char}`);
			}
		}
	}
	tryPushCondition();

	return tokens;
}
