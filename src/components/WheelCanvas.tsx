import React, { useRef, useEffect, useCallback } from 'react';
import { WheelItem, WheelSettings } from '../types/wheel';
import { getContrastingTextColor } from '../utils/colorPalettes';
import { playTickSound, playSpinStartSound, triggerHaptic } from '../utils/audio';

interface WheelCanvasProps {
  items: WheelItem[];
  settings: WheelSettings;
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (winner: WheelItem) => void;
  canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  items,
  settings,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  canvasRefCallback,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0); // radians
  const animationFrameRef = useRef<number | null>(null);
  const pointerDeflectionRef = useRef<number>(0);
  const lastTickSliceIndexRef = useRef<number>(-1);
  const touchStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Active enabled items
  const activeItems = items.filter((item) => item.enabled);

  const getCanvas = useCallback(() => canvasRef.current, []);

  // Pass canvas ref to parent if needed
  useEffect(() => {
    if (canvasRefCallback) {
      canvasRefCallback(canvasRef.current);
    }
  }, [canvasRefCallback]);

  // Main draw function
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    // Offset center down slightly (12px) to provide clearance for top pointer needle
    const centerY = height / 2 + 12;
    // Maximize radius: outerRadius reaches close to canvas edge!
    const outerRadius = Math.min(centerX, (height / 2) + 12) - 14;
    const rimWidth = 16;
    const radius = outerRadius - rimWidth;

    ctx.clearRect(0, 0, width, height);

    if (activeItems.length === 0) {
      // Draw empty wheel placeholder
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px "Prompt", sans-serif';
      ctx.fillText('โปรดเพิ่มรายชื่ออย่างน้อย 1 รายการ', 0, 0);
      ctx.restore();
      return;
    }

    const totalWeight = activeItems.reduce((acc, item) => acc + (item.weight || 1), 0);
    const rotation = currentAngleRef.current;

    ctx.save();
    ctx.translate(centerX, centerY);

    // 1. Draw outer glowing bezel (Gold / Metallic)
    // Rim shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.restore();

    // Metallic rim gradient
    const rimGrad = ctx.createLinearGradient(-outerRadius, -outerRadius, outerRadius, outerRadius);
    rimGrad.addColorStop(0, '#f59e0b');
    rimGrad.addColorStop(0.25, '#fef08a');
    rimGrad.addColorStop(0.5, '#d97706');
    rimGrad.addColorStop(0.75, '#fef08a');
    rimGrad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.lineWidth = rimWidth;
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    // Inner rim ring
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    // 2. Draw Wheel Slices
    let currentSliceAngle = rotation;

    activeItems.forEach((item, index) => {
      const sliceAngle = ((item.weight || 1) / totalWeight) * (Math.PI * 2);
      const startAngle = currentSliceAngle;
      const endAngle = currentSliceAngle + sliceAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Slice base color
      ctx.fillStyle = item.color || '#3b82f6';
      ctx.fill();

      // Subtle gradient highlight overlay for 3D depth
      const sliceGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
      sliceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      sliceGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.03)');
      sliceGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Slice border line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.stroke();

      // Slice text
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);

      const textColor = getContrastingTextColor(item.color || '#3b82f6');
      ctx.fillStyle = textColor;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Proportional font sizing scaled to radius
      const baseScale = radius / 180;
      let fontSize = Math.min(
        Math.round(26 * baseScale),
        Math.max(12, Math.floor((340 * baseScale) / Math.max(6, activeItems.length)))
      );
      if (sliceAngle < 0.22) fontSize = Math.max(10, Math.round(11 * baseScale));
      ctx.font = `600 ${fontSize}px "Prompt", sans-serif`;

      // Text distance from rim
      const textRadius = radius - 14;
      let displayStr = item.text;
      
      // Ellipsis if too long
      const maxCharLength = Math.max(8, Math.floor(textRadius / (fontSize * 0.72)));
      if (displayStr.length > maxCharLength) {
        displayStr = displayStr.substring(0, maxCharLength - 1) + '…';
      }

      // Text drop shadow for maximum crispness
      ctx.shadowColor = textColor === '#FFFFFF' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(displayStr, textRadius, 0);

      ctx.restore();
      ctx.restore();

      currentSliceAngle += sliceAngle;
    });

    // 3. Perimeter Peg Pins (Silver / Gold dots along outer edge)
    const pegCount = Math.max(8, activeItems.length * 2);
    for (let p = 0; p < pegCount; p++) {
      const pegAngle = rotation + (p * Math.PI * 2) / pegCount;
      const px = Math.cos(pegAngle) * (radius + 8);
      const py = Math.sin(pegAngle) * (radius + 8);

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = isSpinning ? 8 : 2;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#b45309';
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset

    // 4. Center Hub (Luxury button & ring)
    const hubRadius = Math.max(46, radius * 0.22);

    // Hub outer shadow
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // Hub golden bezel
    const hubRimGrad = ctx.createLinearGradient(-hubRadius, -hubRadius, hubRadius, hubRadius);
    hubRimGrad.addColorStop(0, '#fde047');
    hubRimGrad.addColorStop(0.5, '#d97706');
    hubRimGrad.addColorStop(1, '#78350f');
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubRimGrad;
    ctx.fill();

    // Hub center face
    const hubFaceGrad = ctx.createRadialGradient(0, -6, 2, 0, 0, hubRadius - 8);
    hubFaceGrad.addColorStop(0, '#312e81');
    hubFaceGrad.addColorStop(1, '#0f172a');
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius - 8, 0, Math.PI * 2);
    ctx.fillStyle = hubFaceGrad;
    ctx.fill();

    // Hub center text / icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${Math.round(hubRadius * 0.40)}px "Prompt", sans-serif`;
    ctx.fillText('SPIN', 0, -hubRadius * 0.12);
    ctx.font = `600 ${Math.round(hubRadius * 0.24)}px "Prompt", sans-serif`;
    ctx.fillStyle = '#fef08a';
    ctx.fillText('หมุนวงล้อ', 0, hubRadius * 0.30);

    ctx.restore();

    // 5. Top Pointer Indicator (Flapper at 12 o'clock / angle = -Math.PI / 2)
    // Pointer deflects realistically as pegs pass!
    drawPointer(ctx, centerX, centerY - outerRadius - 2, pointerDeflectionRef.current);
  }, [activeItems, isSpinning]);

  // Pointer drawing helper with dynamic angle deflection
  const drawPointer = (
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    deflection: number
  ) => {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(deflection);

    // Drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Pointer pin / mount base
    ctx.beginPath();
    ctx.arc(0, -18, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    // Pointer needle / arrow
    const pointerGrad = ctx.createLinearGradient(-16, -18, 16, 28);
    pointerGrad.addColorStop(0, '#ef4444');
    pointerGrad.addColorStop(0.5, '#dc2626');
    pointerGrad.addColorStop(1, '#991b1b');

    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.lineTo(16, -18);
    ctx.lineTo(0, 24); // points down onto wheel rim
    ctx.closePath();
    ctx.fillStyle = pointerGrad;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Golden center gem on needle
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    ctx.restore();
  };

  // Resize canvas according to devicePixelRatio and responsive container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.closest('.wheel-card-container') || canvas.parentElement?.parentElement || canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    // Viewport-height constraint: allow wheel to be truly LARGE & impactful!
    let maxVhRatio = 0.72;
    if (isMobile) {
      // In mobile mode, let wheel take up to 58-62% of screen height
      maxVhRatio = window.innerHeight < 680 ? 0.54 : 0.60;
    } else if (isTablet) {
      maxVhRatio = 0.66;
    }

    const availableHeight = window.innerHeight * maxVhRatio;
    const containerWidth = rect && rect.width > 50 ? rect.width - (isMobile ? 12 : 28) : window.innerWidth - 20;

    // Maximum dimension clamp: up to 760px on desktop, 640px on tablet, 480px on phone
    const maxClamp = isMobile ? 480 : isTablet ? 640 : 760;
    const size = Math.floor(Math.min(containerWidth, availableHeight, maxClamp));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Redraw when items change
  useEffect(() => {
    drawWheel();
  }, [drawWheel, items]);

  // Pointer sound tick calculation
  const checkTickSound = useCallback(
    (currentAngle: number) => {
      if (activeItems.length === 0) return;

      // Pointer is located at top (-Math.PI / 2)
      // Normalize angle relative to pointer
      const pointerAngle = -Math.PI / 2;
      const normalizedAngle = ((pointerAngle - currentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

      const totalWeight = activeItems.reduce((acc, item) => acc + (item.weight || 1), 0);
      let cumulative = 0;
      let currentIndex = 0;

      for (let i = 0; i < activeItems.length; i++) {
        const sliceAngle = ((activeItems[i].weight || 1) / totalWeight) * (Math.PI * 2);
        if (normalizedAngle >= cumulative && normalizedAngle < cumulative + sliceAngle) {
          currentIndex = i;
          break;
        }
        cumulative += sliceAngle;
      }

      if (currentIndex !== lastTickSliceIndexRef.current) {
        lastTickSliceIndexRef.current = currentIndex;
        // Deflect pointer slightly
        pointerDeflectionRef.current = 0.28;

        if (settings.soundEnabled) {
          playTickSound(settings.soundVolume);
        }
        if (settings.vibrationEnabled ?? true) {
          triggerHaptic('light', true);
        }
      } else {
        // Spring back deflection
        pointerDeflectionRef.current *= 0.82;
      }
    },
    [activeItems, settings.soundEnabled, settings.soundVolume, settings.vibrationEnabled]
  );

  // Spin animation execution
  const executeSpin = useCallback(() => {
    if (activeItems.length === 0 || isSpinning) return;

    onSpinStart();

    if (settings.soundEnabled) {
      playSpinStartSound(settings.soundVolume);
    }
    if (settings.vibrationEnabled ?? true) {
      triggerHaptic('medium', true);
    }

    const duration = Math.max(3, settings.spinDuration || 5) * 1000; // ms
    const startTime = performance.now();
    const startAngle = currentAngleRef.current;

    // Pick random target winner index with weights
    const totalWeight = activeItems.reduce((acc, item) => acc + (item.weight || 1), 0);
    const randomWeight = Math.random() * totalWeight;
    let selectedIndex = 0;
    let weightSum = 0;

    for (let i = 0; i < activeItems.length; i++) {
      weightSum += activeItems[i].weight || 1;
      if (randomWeight <= weightSum) {
        selectedIndex = i;
        break;
      }
    }

    // Determine target slice angular span
    let beforeWeight = 0;
    for (let i = 0; i < selectedIndex; i++) {
      beforeWeight += activeItems[i].weight || 1;
    }
    const targetSliceWeight = activeItems[selectedIndex].weight || 1;
    const startSliceAngle = (beforeWeight / totalWeight) * (Math.PI * 2);
    const sliceAngleSpan = (targetSliceWeight / totalWeight) * (Math.PI * 2);

    // Land in the middle 70% of the slice for clear visual landing
    const offsetInSlice = sliceAngleSpan * (0.15 + Math.random() * 0.7);
    const targetSliceCenter = startSliceAngle + offsetInSlice;

    // Pointer is at 12 o'clock (-Math.PI / 2)
    const pointerAngle = -Math.PI / 2;

    // Base target rotations (at least 6-10 full spins)
    const baseRotations = (6 + Math.floor(Math.random() * 4)) * Math.PI * 2;
    
    // Calculate final angle such that targetSliceCenter lands at pointerAngle
    const targetFinalAngle =
      startAngle +
      baseRotations +
      (((pointerAngle - targetSliceCenter - (startAngle % (Math.PI * 2))) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));

    const totalAngleDelta = targetFinalAngle - startAngle;

    // Easing curve: quintic ease out for suspenseful final crawl
    const easeOutQuint = (t: number): number => {
      return 1 - Math.pow(1 - t, 5);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutQuint(progress);

      currentAngleRef.current = startAngle + totalAngleDelta * easedProgress;

      checkTickSound(currentAngleRef.current);
      drawWheel();

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished!
        pointerDeflectionRef.current = 0;
        drawWheel();
        if (settings.vibrationEnabled ?? true) {
          triggerHaptic('win', true);
        }
        onSpinEnd(activeItems[selectedIndex]);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [
    activeItems,
    isSpinning,
    onSpinStart,
    settings.soundEnabled,
    settings.spinDuration,
    settings.soundVolume,
    settings.vibrationEnabled,
    checkTickSound,
    drawWheel,
    onSpinEnd,
  ]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSpinning || activeItems.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const dist = Math.sqrt(x * x + y * y);

    // If clicked anywhere inside wheel, spin!
    if (dist <= rect.width / 2) {
      executeSpin();
    }
  };

  // Touch gesture handling: Swipe / flick to spin, or tap
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isSpinning || activeItems.length === 0) return;
    const touch = e.touches[0];
    touchStartPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isSpinning || activeItems.length === 0 || !touchStartPosRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;
    const dist = Math.hypot(dx, dy);
    const duration = Date.now() - touchStartPosRef.current.time;
    touchStartPosRef.current = null;

    // Check if it's a swipe/flick (distance > 20px within 500ms)
    if (dist > 20 && duration < 600) {
      executeSpin();
      return;
    }

    // Check if it's a tap inside the wheel
    const canvas = canvasRef.current;
    if (canvas && dist <= 20) {
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left - rect.width / 2;
      const y = touch.clientY - rect.top - rect.height / 2;
      if (Math.hypot(x, y) <= rect.width / 2) {
        executeSpin();
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none">
      <div className="relative group cursor-pointer touch-none flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="transition-transform duration-150 active:scale-[0.98] drop-shadow-2xl cursor-pointer"
          title={isSpinning ? 'กำลังหมุน...' : 'แตะที่วงล้อ ปัดนิ้ว หรือกดปุ่มเพื่อเริ่มหมุน'}
        />
      </div>

      {/* Touch & gesture hint badge */}
      <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-white/5">
        <span>👆</span>
        <span>แตะตรงกลาง หรือปัดนิ้วเพื่อหมุน</span>
      </div>

      {/* External Action Button */}
      <div className="mt-3 flex flex-col items-center gap-1.5 w-full max-w-sm px-2">
        <button
          onClick={executeSpin}
          disabled={isSpinning || activeItems.length === 0}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 rounded-2xl font-bold text-base sm:text-lg shadow-xl transition-all duration-200 cursor-pointer min-h-[48px] ${
            isSpinning || activeItems.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-110 hover:shadow-amber-500/30 active:scale-95 shadow-lg shadow-amber-500/20'
          }`}
        >
          <span className="text-xl">🎯</span>
          <span>{isSpinning ? 'กำลังสุ่มผู้โชคดี...' : 'หมุนวงล้อเลย!'}</span>
        </button>
        <span className="text-xs text-slate-400">
          {activeItems.length > 0
            ? `พร้อมหมุน ${activeItems.length} ช่อง`
            : 'กรุณาเปิดหรือเพิ่มรายชื่อ'}
        </span>
      </div>
    </div>
  );
};
