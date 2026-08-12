import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export interface CanvasPreviewProps {
  photo: HTMLImageElement | null;
  name: string;
  stack: string;
  title: string;
  onCanvasReady?: (blob: Blob) => void;
}

export interface CanvasRef {
  getBlob: () => Promise<Blob | null>;
}

export const CanvasPreview = forwardRef<CanvasRef, CanvasPreviewProps>(({
  photo,
  name,
  stack,
  title,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Transform state for the photo
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState<number | null>(null);

  // Constants for drawing
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 1200;
  const BORDER_WIDTH = 20;

  // Initial fit of the photo
  useEffect(() => {
    if (photo) {
      // Photo rect
      const PHOTO_AREA_SIZE = 800; // approximate size of the photo box
      const scaleX = PHOTO_AREA_SIZE / photo.width;
      const scaleY = PHOTO_AREA_SIZE / photo.height;
      const initialScale = Math.max(scaleX, scaleY);
      setScale(initialScale);
      setPan({ x: 0, y: 0 });
    }
  }, [photo]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background - Deep Green
    ctx.fillStyle = '#105935';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Decorative Borders
    ctx.strokeStyle = '#ffd900'; // Yellow
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 60);
    
    ctx.strokeStyle = '#ff007f'; // Pink dotted inner
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 12]);
    ctx.strokeRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);
    ctx.setLineDash([]); // reset

    // Draw Photo Area Background
    const photoBoxSize = 640;
    const photoBoxX = CANVAS_WIDTH / 2 - photoBoxSize / 2;
    const photoBoxY = 100;
    const textStartY = photoBoxY + photoBoxSize + 80;
    
    ctx.fillStyle = '#f8f4e6'; // Cream
    ctx.fillRect(photoBoxX, photoBoxY, photoBoxSize, photoBoxSize);

    // Draw Photo if exists, clipped to the box
    if (photo) {
      ctx.save();
      
      // Clipping path for the photo box
      ctx.beginPath();
      ctx.rect(photoBoxX, photoBoxY, photoBoxSize, photoBoxSize);
      ctx.clip();

      // Calculate center of the photo box
      const centerX = photoBoxX + photoBoxSize / 2;
      const centerY = photoBoxY + photoBoxSize / 2;

      // Draw the image with translation and scale
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.scale(scale, scale);
      
      // Draw centered
      ctx.drawImage(
        photo, 
        -photo.width / 2, 
        -photo.height / 2, 
        photo.width, 
        photo.height
      );

      ctx.restore();
    }

    // Photo Box Border
    ctx.strokeStyle = '#ffd900';
    ctx.lineWidth = 8;
    ctx.strokeRect(photoBoxX, photoBoxY, photoBoxSize, photoBoxSize);

    // Text Content
    ctx.textAlign = 'center';
    
    // Name (Serif, Yellow)
    ctx.font = 'bold 72px "Playfair Display", serif';
    ctx.fillStyle = '#ffd900';
    ctx.fillText((name || 'YOUR NAME').toUpperCase(), CANVAS_WIDTH / 2, textStartY);

    // Devanagari Accent
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ff007f';
    ctx.fillText('गोवा', CANVAS_WIDTH / 2, textStartY + 45);

    // Builder Title (Serif, Pink or Yellow)
    ctx.font = 'italic 36px "Playfair Display", serif';
    ctx.fillStyle = '#f8f4e6';
    ctx.fillText(title || 'BUILDER TITLE', CANVAS_WIDTH / 2, textStartY + 110);

    // Stack (Monospace)
    ctx.font = '24px "Space Mono", monospace';
    ctx.fillStyle = '#ffd900';
    ctx.fillText(`✦ ${stack ? stack.toUpperCase() : 'STACK'} ✦`, CANVAS_WIDTH / 2, textStartY + 165);

    // Footer Metadata
    ctx.font = '20px "Space Mono", monospace';
    ctx.fillStyle = '#f8f4e6';
    ctx.fillText('HH GOA 2026 · GOA, INDIA · 28–31 OCT', CANVAS_WIDTH / 2, textStartY + 230);
    
    ctx.fillStyle = '#ff007f';
    ctx.fillText('#FrameInGoa', CANVAS_WIDTH / 2, textStartY + 270);
  };

  useEffect(() => {
    // Ensure fonts are loaded before drawing. A simple hack is to draw again after a short delay
    document.fonts.ready.then(() => {
      draw();
    });
    draw();
  }, [photo, name, stack, title, scale, pan]);

  // Expose getting a Blob
  useImperativeHandle(ref, () => ({
    getBlob: () => {
      return new Promise((resolve) => {
        if (!canvasRef.current) resolve(null);
        else canvasRef.current.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    }
  }));

  // Handlers for drag/zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!photo) return;
    setIsDragging(true);
    setLastPointer({ x: e.clientX, y: e.clientY });
    if (e.pointerType !== 'mouse') e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !photo) return;
    
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    
    // Scale the movement according to the canvas display size vs internal size
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scaleRatio = CANVAS_WIDTH / rect.width;
      setPan(p => ({ x: p.x + dx * scaleRatio, y: p.y + dy * scaleRatio }));
    }
    
    setLastPointer({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setLastDistance(null);
    if (e.pointerType !== 'mouse') e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!photo) return;
    const zoomFactor = -e.deltaY * 0.001;
    setScale(s => Math.max(0.1, s * (1 + zoomFactor)));
  };

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-hh-yellow/50 touch-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />
      {photo && (
        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none font-mono">
          Pinch/Scroll to Zoom · Drag to Move
        </div>
      )}
    </div>
  );
});

CanvasPreview.displayName = 'CanvasPreview';
