import React, { useEffect, useRef } from 'react';

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()_+{}|:"<>?~✦';
const HH_COLORS = ['#ffd900', '#ff007f', '#f8f4e6'];

export function HackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize
    if (!ctx) return;

    let animationFrameId: number;
    let cols = 0;
    let rows = 0;
    const fontSize = 24;
    
    // Using a flat Float32Array or similar would be faster, but for 24px grid 
    // standard objects are fine for modern devices.
    type Cell = { char: string; life: number; maxLife: number; color: string; bgLife: number };
    let cells: Cell[][] = [];

    let mouse = { x: -1000, y: -1000 };
    let isMouseMoving = false;
    let mouseTimeout: NodeJS.Timeout;

    const radius = 150;

    const resize = () => {
      // Handle high DPI displays for crisp text
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      cols = Math.floor(window.innerWidth / fontSize) + 1;
      rows = Math.floor(window.innerHeight / fontSize) + 1;
      
      cells = Array.from({ length: cols }, () => 
        Array.from({ length: rows }, () => ({
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
          life: 0,
          maxLife: Math.random() * 40 + 20,
          color: HH_COLORS[Math.floor(Math.random() * HH_COLORS.length)],
          bgLife: Math.random() * 100
        }))
      );
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      isMouseMoving = true;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => { isMouseMoving = false; }, 100);
    };
    const handleTouchMove = (e: TouchEvent) => {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      isMouseMoving = true;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => { isMouseMoving = false; }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const draw = () => {
      // Solid background
      ctx.fillStyle = '#105935'; 
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.font = `bold ${fontSize - 4}px "Space Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const cell = cells[i][j];
          const x = i * fontSize + fontSize / 2;
          const y = j * fontSize + fontSize / 2;

          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Activate cells near the cursor
          if (dist < radius && isMouseMoving) {
            if (cell.life <= 0) {
              cell.life = cell.maxLife;
              cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
          }

          if (cell.life > 0) {
            // "Signal" - active trail
            const opacity = cell.life / cell.maxLife;
            ctx.fillStyle = cell.color;
            ctx.globalAlpha = opacity;
            ctx.fillText(cell.char, x, y);
            cell.life -= 1;
          } else {
            // "Noise" - background idle animation
            cell.bgLife -= 1;
            if (cell.bgLife <= 0) {
              cell.bgLife = Math.random() * 200 + 100;
              cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
            
            ctx.fillStyle = '#f8f4e6';
            ctx.globalAlpha = 0.05; // Very dim noise
            ctx.fillText(cell.char, x, y);
          }
        }
      }
      ctx.globalAlpha = 1.0; // reset
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(mouseTimeout);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />;
}
