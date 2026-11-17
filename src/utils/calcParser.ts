// Safe arithmetic expression parser (no eval)
// Supports +, -, *, /, %, parentheses, unary +/-, and decimal numbers.

type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '%' }
  | { type: 'paren'; value: '(' | ')' };

function tokenize(raw: string): Token[] {
  const expr = raw.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      let dotCount = 0;
      while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
        if (expr[i] === '.') dotCount++;
        if (dotCount > 1) throw new Error('Invalid number');
        numStr += expr[i];
        i++;
      }
      if (numStr === '.') throw new Error('Invalid number');
      tokens.push({ type: 'num', value: parseFloat(numStr) });
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%') {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
    } else {
      throw new Error(`Unexpected char: ${ch}`);
    }
  }
  return tokens;
}

export function evaluateExpression(raw: string): number | null {
  if (!raw.trim()) return null;
  try {
    const tokens = tokenize(raw);
    if (tokens.length === 0) return null;
    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    function parseExpr(): number {
      let val = parseTerm();
      while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const right = parseTerm();
        val = op === '+' ? val + right : val - right;
      }
      return val;
    }

    function parseTerm(): number {
      let val = parseFactor();
      while (
        peek()?.type === 'op' &&
        (peek().value === '*' || peek().value === '/' || peek().value === '%')
      ) {
        const op = consume().value;
        const right = parseFactor();
        if (op === '*') val = val * right;
        else if (op === '/') {
          if (right === 0) throw new Error('Division by zero');
          val = val / right;
        } else {
          // Handle % as percentage or modulo? In standard calculators like Windows/SKCT:
          // If followed by nothing or operator, e.g. 50% -> 0.5, or a % b -> a * (b/100) or modulo.
          // Let's handle postfix % in parseFactor and binary mod here if needed:
          val = val % right;
        }
      }
      return val;
    }

    function parseFactor(): number {
      const tok = peek();
      if (!tok) throw new Error('Unexpected end');
      if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
        consume();
        const inner = parseFactor();
        return tok.value === '-' ? -inner : inner;
      }
      let base: number;
      if (tok.type === 'num') {
        consume();
        base = tok.value;
      } else if (tok.type === 'paren' && tok.value === '(') {
        consume();
        base = parseExpr();
        const closing = consume();
        if (!closing || closing.type !== 'paren' || closing.value !== ')') {
          throw new Error('Mismatched paren');
        }
      } else {
        throw new Error('Unexpected token');
      }

      // Support postfix % (e.g., 200*15% -> 200*0.15)
      while (peek()?.type === 'op' && peek().value === '%') {
        const nextTok = tokens[pos + 1];
        if (
          !nextTok ||
          nextTok.type === 'op' ||
          (nextTok.type === 'paren' && nextTok.value === ')')
        ) {
          consume();
          base = base / 100;
        } else {
          break;
        }
      }
      return base;
    }

    const result = parseExpr();
    if (pos !== tokens.length || !Number.isFinite(result)) return null;
    // Clean floating point noise like 0.1 + 0.2
    return Math.round(result * 1e10) / 1e10;
  } catch {
    return null;
  }
}

export function formatCalcNumber(num: number): string {
  if (!Number.isFinite(num)) return '오류';
  const rounded = Math.round(num * 1e8) / 1e8;
  return String(rounded);
}
