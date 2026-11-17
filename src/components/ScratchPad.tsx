import React, { useEffect, useRef, useState } from 'react';

interface ScratchPadProps {
  clearSignal: number; // Increments whenever parent requests auto-clear
}

export const ScratchPad: React.FC<ScratchPadProps> = ({ clearSignal }) => {
  const [activeTab, setActiveTab] = useState<'memo' | 'draw'>('memo');
  const [memoText, setMemoText] = useState<string>('');
  const [penColor, setPenColor] = useState<'#1a202c' | '#ea002c' | '#ffffff'>('#1a202c');
  const [penSize, setPenSize] = useState<number>(2);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  // Preserve canvas image data when switching tabs
  const savedImageRef = useRef<string | null>(null);

  const initCanvasSize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.floor(rect.width * dpr);
    const targetH = Math.floor(rect.height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      // Save existing drawing before resize
      if (canvas.width > 0 && canvas.height > 0) {
        savedImageRef.current = canvas.toDataURL();
      }
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        if (savedImageRef.current) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = savedImageRef.current;
        }
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'draw') {
      // Wait a tick for layout
      const id = requestAnimationFrame(() => initCanvasSize());
      const handleResize = () => initCanvasSize();
      window.addEventListener('resize', handleResize);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [activeTab]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    savedImageRef.current = null;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = container.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const handleClearAll = () => {
    if (activeTab === 'memo') {
      setMemoText('');
    } else {
      clearCanvas();
    }
  };

  useEffect(() => {
    if (clearSignal > 0) {
      setMemoText('');
      clearCanvas();
    }
  }, [clearSignal]);

  const getLocalPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getLocalPos(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = getLocalPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penColor === '#ffffff' ? 14 : penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPointRef.current = current;
  };

  const handlePointerUp = () => {
    if (drawingRef.current && canvasRef.current) {
      savedImageRef.current = canvasRef.current.toDataURL();
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  return (
    <div className="tool-card scratch-card">
      <div className="scratch-tabs">
        <button
          type="button"
          className={`scratch-tab-btn ${activeTab === 'memo' ? 'active' : ''}`}
          onClick={() => {
            if (activeTab === 'draw' && canvasRef.current) {
              savedImageRef.current = canvasRef.current.toDataURL();
            }
            setActiveTab('memo');
          }}
        >
          메모장
        </button>
        <button
          type="button"
          className={`scratch-tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
          onClick={() => setActiveTab('draw')}
        >
          그림판
        </button>
      </div>

      <div className="scratch-toolbar">
        {activeTab === 'draw' ? (
          <div className="pen-controls">
            <button
              type="button"
              className={`pen-color-dot ${penColor === '#1a202c' ? 'active' : ''}`}
              style={{ background: '#1a202c' }}
              title="검정 펜"
              onClick={() => {
                setPenColor('#1a202c');
                setPenSize(2);
              }}
            />
            <button
              type="button"
              className={`pen-color-dot ${penColor === '#ea002c' ? 'active' : ''}`}
              style={{ background: '#ea002c' }}
              title="SK 빨강 펜"
              onClick={() => {
                setPenColor('#ea002c');
                setPenSize(2);
              }}
            />
            <button
              type="button"
              className={`btn btn-sm ${penColor === '#ffffff' ? 'btn-slate' : 'btn-outline'}`}
              onClick={() => setPenColor('#ffffff')}
            >
              지우개
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '11.5px', color: '#718096' }}>간단한 식 · 메모 작성</span>
        )}
        <button type="button" className="btn btn-slate btn-sm" onClick={handleClearAll}>
          전체 지우기
        </button>
      </div>

      <div ref={containerRef} className="scratch-body">
        {activeTab === 'memo' ? (
          <textarea
            className="memo-textarea"
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="여기에 작성하세요"
            spellCheck={false}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="draw-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}
      </div>
    </div>
  );
};
