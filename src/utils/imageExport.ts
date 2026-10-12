import { WinnerRecord } from '../types/wheel';

/**
 * Generates and downloads a high-resolution Winner Certificate card (PNG).
 */
export async function exportWinnerCertificate(
  winner: WinnerRecord,
  eventName: string = 'วงล้อจับรางวัล'
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  // 1. Background Luxury Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
  bgGrad.addColorStop(0, '#0f172a'); // slate-900
  bgGrad.addColorStop(0.5, '#1e1b4b'); // indigo-950
  bgGrad.addColorStop(1, '#020617'); // slate-950
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 800);

  // Decorative Golden Glow
  const radialGlow = ctx.createRadialGradient(600, 400, 50, 600, 400, 550);
  radialGlow.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
  radialGlow.addColorStop(0.6, 'rgba(99, 102, 241, 0.12)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, 1200, 800);

  // 2. Double Gold Borders
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#f59e0b';
  ctx.strokeRect(36, 36, 1200 - 72, 800 - 72);

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
  ctx.strokeRect(48, 48, 1200 - 96, 800 - 96);

  // Corner Ornaments
  const corners = [
    [52, 52],
    [1200 - 52, 52],
    [52, 800 - 52],
    [1200 - 52, 800 - 52],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();
  });
  ctx.restore();

  // 3. Header Ribbon / Subtitle
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fcd34d';
  ctx.font = '600 24px "Prompt", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('★ ★ ★  LUCKY DRAW WINNER CERTIFICATE  ★ ★ ★', 600, 115);

  // Event Name
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 28px "Prompt", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(eventName || 'กิจกรรมจับรางวัลพิเศษ', 600, 165);

  // Round badge
  ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.beginPath();
  ctx.roundRect(475, 190, 250, 42, 21);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = '600 20px "Prompt", sans-serif';
  ctx.fillText(`สุ่มรอบที่ #${winner.round}`, 600, 218);

  // 4. Trophy Drawing
  drawTrophy(ctx, 600, 290);

  // 5. "ยินดีด้วยกับผู้โชคดี!" Banner
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 22px "Prompt", sans-serif';
  ctx.fillText('ขอแสดงความยินดีกับผู้โชคดี', 600, 395);

  // 6. Giant Winner Name Card / Container
  const winnerCardWidth = 840;
  const winnerCardHeight = 150;
  const cardX = 600 - winnerCardWidth / 2;
  const cardY = 425;

  // Winner card background
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + winnerCardHeight);
  cardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  cardGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, winnerCardWidth, winnerCardHeight, 20);
  ctx.fill();
  ctx.strokeStyle = winner.item.color || '#f59e0b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Winner Name
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
  ctx.shadowBlur = 18;
  ctx.font = 'bold 54px "Prompt", sans-serif';
  
  // Truncate or fit if too long
  let text = winner.item.text;
  if (text.length > 28) {
    text = text.substring(0, 26) + '...';
  }
  ctx.fillText(text, 600, 520);
  ctx.shadowBlur = 0; // reset

  // 7. Footer: Timestamp & Verification Stamp
  const dateObj = new Date(winner.timestamp);
  const formattedDate = dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 18px "Prompt", sans-serif';
  ctx.fillText(`วันที่ประกาศผล: ${formattedDate} เวลา ${formattedTime} น.`, 90, 680);
  ctx.fillText(`รหัสผลสุ่ม: #${winner.id.substring(0, 8).toUpperCase()}`, 90, 712);

  // Official Gold Stamp on the right
  drawStamp(ctx, 1050, 680);

  // Export as PNG
  const dataUrl = canvas.toDataURL('image/png');
  triggerDownload(dataUrl, `lucky-winner-round-${winner.round}.png`);
  return dataUrl;
}

/**
 * Downloads a screenshot of the Wheel Canvas.
 */
export function exportWheelSnapshot(wheelCanvas: HTMLCanvasElement, title: string = 'วงล้อนำโชค'): string {
  const exportCanvas = document.createElement('canvas');
  const pad = 60;
  exportCanvas.width = wheelCanvas.width + pad * 2;
  exportCanvas.height = wheelCanvas.height + pad * 2 + 100;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const grad = ctx.createLinearGradient(0, 0, exportCanvas.width, exportCanvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 36px "Prompt", sans-serif';
  ctx.fillText(title, exportCanvas.width / 2, 65);

  // Draw wheel
  ctx.drawImage(wheelCanvas, pad, 100);

  const dataUrl = exportCanvas.toDataURL('image/png');
  triggerDownload(dataUrl, `lucky-wheel-${Date.now()}.png`);
  return dataUrl;
}

function triggerDownload(dataUrl: string, fileName: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Cup body
  const grad = ctx.createLinearGradient(-30, -40, 30, 20);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#b45309');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-35, -35);
  ctx.lineTo(35, -35);
  ctx.bezierCurveTo(35, 10, 20, 25, 0, 28);
  ctx.bezierCurveTo(-20, 25, -35, 10, -35, -35);
  ctx.closePath();
  ctx.fill();

  // Handles
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(-36, -15, 15, Math.PI * 0.5, Math.PI * 1.5, false);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(36, -15, 15, Math.PI * 1.5, Math.PI * 0.5, false);
  ctx.stroke();

  // Stem & Base
  ctx.fillRect(-6, 28, 12, 18);
  ctx.fillRect(-26, 44, 52, 14);

  // Star in cup
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.15); // slight tilt

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 13px "Prompt", sans-serif';
  ctx.fillText('★ OFFICIAL ★', 0, -18);
  ctx.font = 'bold 16px "Prompt", sans-serif';
  ctx.fillText('VERIFIED', 0, 6);
  ctx.font = '600 12px "Prompt", sans-serif';
  ctx.fillText('LUCKY DRAW', 0, 26);

  ctx.restore();
}
