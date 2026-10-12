import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { WinnerRecord, WheelItem } from '../types/wheel';
import { exportWinnerCertificate } from '../utils/imageExport';
import { playWinFanfare, playCheerSound } from '../utils/audio';
import {
  Trophy,
  Download,
  RotateCcw,
  CheckCircle,
  X,
  Sparkles,
  Share2,
} from 'lucide-react';

interface WinnerModalProps {
  winner: WinnerRecord;
  presetName: string;
  autoRemoved: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  confettiEnabled: boolean;
  onClose: () => void;
  onRestoreWinner: (item: WheelItem) => void;
  onRemoveWinnerManually: (item: WheelItem) => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  presetName,
  autoRemoved,
  soundEnabled,
  soundVolume,
  confettiEnabled,
  onClose,
  onRestoreWinner,
  onRemoveWinnerManually,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Trigger celebration on mount
  useEffect(() => {
    // 1. Play Fanfare & Cheer sounds
    if (soundEnabled) {
      playWinFanfare(soundVolume);
      playCheerSound(soundVolume);
    }

    // 2. Confetti bursts
    if (confettiEnabled) {
      const count = 200;
      const defaults = {
        origin: { y: 0.65 },
        zIndex: 100,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [soundEnabled, soundVolume, confettiEnabled]);

  // Handle Export Certificate to PNG image
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportWinnerCertificate(winner, presetName);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการส่งออกภาพ โปรดลองอีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUndoRemove = () => {
    onRestoreWinner(winner.item);
    setIsRestored(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/80 to-slate-950 border-2 border-amber-500/60 p-5 sm:p-8 shadow-2xl text-slate-100 flex flex-col items-center text-center gap-4 sm:gap-5 overflow-y-auto max-h-[92dvh] my-auto">
        {/* Glowing backdrop circle */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy icon */}
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-lg shadow-amber-500/40 animate-bounce">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 fill-amber-400/20" />
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-1 -right-2 animate-pulse" />
        </div>

        {/* Header Titles */}
        <div>
          <span className="inline-block text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold mb-2">
            ★ สุ่มรอบที่ #{winner.round} ★
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500">
            ขอแสดงความยินดีกับผู้โชคดี!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{presetName}</p>
        </div>

        {/* Giant Winner Display Card */}
        <div
          className="w-full py-5 px-6 rounded-2xl border-2 shadow-2xl relative overflow-hidden backdrop-blur-md"
          style={{
            borderColor: winner.item.color || '#f59e0b',
            background: `radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(15,23,42,0.85) 100%)`,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm"
              style={{ backgroundColor: winner.item.color }}
            />
            <span className="text-xs uppercase font-medium text-slate-400">
              ผู้ชนะประจำรอบ
            </span>
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-md break-words py-1">
            {winner.item.text}
          </div>
        </div>

        {/* Auto-remove indicator status */}
        <div className="w-full p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
          {autoRemoved ? (
            isRestored ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle className="w-4 h-4" />
                ดึงผู้ชนะกลับสู่วงล้อเรียบร้อยแล้ว
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1 text-amber-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ลบผู้ชนะออกจากวงล้ออัตโนมัติแล้ว
                </span>
                <button
                  onClick={handleUndoRemove}
                  className="text-xs text-indigo-300 hover:text-white underline cursor-pointer"
                >
                  เลิกทำ (ดึงกลับมา)
                </button>
              </>
            )
          ) : (
            <>
              <span>ผู้ชนะยังอยู่ในวงล้อ</span>
              <button
                onClick={() => onRemoveWinnerManually(winner.item)}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                ลบออกจากวงล้อตอนนี้
              </button>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export Certificate to PNG Image Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
            title="บันทึกผลการจับรางวัลเป็นไฟล์ภาพ PNG พร้อมเกียรติบัตร"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting
                ? 'กำลังสร้างภาพ...'
                : exportSuccess
                ? 'บันทึกภาพสำเร็จ!'
                : 'บันทึกผลเป็นภาพ (PNG)'}
            </span>
          </button>

          {/* Close & Spin Again */}
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-indigo-400" />
            <span>หมุนรอบถัดไป</span>
          </button>
        </div>
      </div>
    </div>
  );
};
