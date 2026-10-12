import React from 'react';
import { Radio, Users, Tv, RefreshCw } from 'lucide-react';
import { SALA_ACCOUNTS } from '../types/wheel';

interface SalaHeaderStatusProps {
  currentRoomId: string | null;
  isDisplayMode: boolean;
  onOpenModal: () => void;
  onToggleDisplayMode: () => void;
  isSyncing?: boolean;
}

export const SalaHeaderStatus: React.FC<SalaHeaderStatusProps> = ({
  currentRoomId,
  isDisplayMode,
  onOpenModal,
  onToggleDisplayMode,
  isSyncing = false,
}) => {
  const currentAccount = SALA_ACCOUNTS.find((a) => a.username === currentRoomId);

  if (!currentRoomId) {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer active:scale-95 min-h-[36px] shadow-sm shadow-emerald-950"
        title="เข้าสู่ระบบ sala1, sala2, sala3 เพื่อซิงค์ข้อมูลสดทุกจอพร้อมกัน"
      >
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="hidden sm:inline">ซิงค์สดทุกจอ (sala)</span>
        <span className="sm:hidden">ซิงค์จอ</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Live Sala Room Indicator */}
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/60 text-xs font-semibold text-emerald-300 transition cursor-pointer active:scale-95 min-h-[36px]"
        title={`กำลังซิงค์เรียลไทม์กับห้อง: ${currentAccount?.displayName || currentRoomId} (คลิกเพื่อเปลี่ยนห้อง)`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span className="font-bold">{currentRoomId.toUpperCase()}</span>
        <span className="hidden md:inline text-[11px] text-emerald-400/80">
          • ซิงค์สด
        </span>
        {isSyncing && <RefreshCw className="w-3 h-3 text-emerald-300 animate-spin ml-0.5" />}
      </button>

      {/* Stage / Display Mode Quick Toggle */}
      <button
        onClick={onToggleDisplayMode}
        className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-medium transition cursor-pointer min-h-[36px] ${
          isDisplayMode
            ? 'bg-sky-500/30 border-sky-400 text-sky-200'
            : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-300'
        }`}
        title={isDisplayMode ? 'กลับสู่โหมดควบคุม' : 'สลับสู่โหมดจอแสดงผลเวที / ขยายวงล้อใหญ่'}
      >
        <Tv className={`w-3.5 h-3.5 ${isDisplayMode ? 'text-sky-300' : 'text-slate-400'}`} />
        <span className="hidden sm:inline text-[11px]">
          {isDisplayMode ? 'จอใหญ่' : 'โหมดจอ'}
        </span>
      </button>
    </div>
  );
};
