import React, { useEffect, useRef, useState } from 'react';
import { evaluateExpression, formatCalcNumber } from '../utils/calcParser';

export const Calculator: React.FC = () => {
  const [expr, setExpr] = useState<string>('');
  const [displayResult, setDisplayResult] = useState<string>('0');
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [kbdActive, setKbdActive] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const appendToken = (token: string) => {
    const isOperator = ['+', '-', '×', '÷', '%'].includes(token);
    if (justEvaluated) {
      if (isOperator) {
        const base = displayResult === '오류' ? '0' : displayResult;
        setExpr(base + token);
      } else {
        setExpr(token);
      }
      setJustEvaluated(false);
      return;
    }

    setExpr((prev) => {
      if (prev === '0' && token >= '0' && token <= '9') {
        return token;
      }
      return prev + token;
    });
  };

  const handleBackspace = () => {
    if (justEvaluated) {
      setExpr('');
      setDisplayResult('0');
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => prev.slice(0, -1));
  };

  const handleAllClear = () => {
    setExpr('');
    setDisplayResult('0');
    setJustEvaluated(false);
  };

  const handleToggleSign = () => {
    if (justEvaluated) {
      const val = parseFloat(displayResult);
      if (!Number.isNaN(val)) {
        const flipped = formatCalcNumber(-val);
        setDisplayResult(flipped);
        setExpr(flipped);
        setJustEvaluated(false);
      }
      return;
    }
    setExpr((prev) => {
      if (!prev) return '-';
      if (prev.startsWith('-(') && prev.endsWith(')')) {
        return prev.slice(2, -1);
      }
      if (/^-?\d+(\.\d+)?$/.test(prev)) {
        return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
      }
      return `-(${prev})`;
    });
  };

  const handleEquals = () => {
    if (!expr.trim()) return;
    const val = evaluateExpression(expr);
    if (val === null) {
      setDisplayResult('오류');
    } else {
      setDisplayResult(formatCalcNumber(val));
    }
    setJustEvaluated(true);
  };

  // Live preview while typing expression
  const livePreview = !justEvaluated && expr ? evaluateExpression(expr) : null;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setKbdActive(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!kbdActive) return;
    const key = e.key;
    if (key >= '0' && key <= '9') {
      e.preventDefault();
      appendToken(key);
    } else if (key === '.') {
      e.preventDefault();
      appendToken('.');
    } else if (key === '+') {
      e.preventDefault();
      appendToken('+');
    } else if (key === '-') {
      e.preventDefault();
      appendToken('-');
    } else if (key === '*') {
      e.preventDefault();
      appendToken('×');
    } else if (key === '/') {
      e.preventDefault();
      appendToken('÷');
    } else if (key === '%') {
      e.preventDefault();
      appendToken('%');
    } else if (key === '(' || key === ')') {
      e.preventDefault();
      appendToken(key);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleEquals();
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (key === 'Escape' || key === 'Delete') {
      e.preventDefault();
      handleAllClear();
    }
  };

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      onFocus={() => setKbdActive(true)}
      onClick={() => {
        setKbdActive(true);
        cardRef.current?.focus();
      }}
      onKeyDown={handleKeyDown}
      className={`tool-card calc-card ${kbdActive ? 'kbd-active' : ''}`}
      style={{ outline: 'none' }}
    >
      <div className="calc-header">
        <span className="calc-title">계산기</span>
        <span className={`calc-kbd-badge ${kbdActive ? 'on' : ''}`}>
          {kbdActive ? '키패드 입력 활성' : '클릭 시 키보드 입력'}
        </span>
      </div>

      <div className="calc-display">
        <div className="calc-expr">{expr || '\u00A0'}</div>
        <div className="calc-result">
          {justEvaluated
            ? displayResult
            : livePreview !== null
              ? formatCalcNumber(livePreview)
              : expr || '0'}
        </div>
      </div>

      <div className="calc-grid">
        <button type="button" className="calc-btn op" onClick={() => appendToken('(')}>
          (
        </button>
        <button type="button" className="calc-btn op" onClick={() => appendToken(')')}>
          )
        </button>
        <button type="button" className="calc-btn op" onClick={() => appendToken('%')}>
          %
        </button>
        <button type="button" className="calc-btn ac" onClick={handleBackspace} title="한 글자 지우기">
          C
        </button>

        <button type="button" className="calc-btn ac" onClick={handleAllClear} title="전체 지우기">
          AC
        </button>
        <button type="button" className="calc-btn op" onClick={handleToggleSign}>
          +/-
        </button>
        <button type="button" className="calc-btn op" onClick={() => appendToken('÷')}>
          ÷
        </button>
        <button type="button" className="calc-btn op" onClick={() => appendToken('×')}>
          ×
        </button>

        <button type="button" className="calc-btn" onClick={() => appendToken('7')}>
          7
        </button>
        <button type="button" className="calc-btn" onClick={() => appendToken('8')}>
          8
        </button>
        <button type="button" className="calc-btn" onClick={() => appendToken('9')}>
          9
        </button>
        <button type="button" className="calc-btn op" onClick={() => appendToken('-')}>
          -
        </button>

        <button type="button" className="calc-btn" onClick={() => appendToken('4')}>
          4
        </button>
        <button type="button" className="calc-btn" onClick={() => appendToken('5')}>
          5
        </button>
        <button type="button" className="calc-btn" onClick={() => appendToken('6')}>
          6
        </button>
        <button type="button" className="calc-btn op" onClick={() => appendToken('+')}>
          +
        </button>

        <button type="button" className="calc-btn span2" onClick={() => appendToken('0')}>
          0
        </button>
        <button type="button" className="calc-btn" onClick={() => appendToken('.')}>
          .
        </button>
        <button type="button" className="calc-btn eq" onClick={handleEquals}>
          =
        </button>
      </div>
    </div>
  );
};
