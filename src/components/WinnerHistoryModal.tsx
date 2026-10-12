import React from 'react';
import { WinnerRecord, WheelItem } from '../types/wheel';
import { exportWinnerCertificate } from '../utils/imageExport';
import {
  History,
  Trophy,
  RotateCcw,
  Download,
  Trash2,
  X,
  FileText,
} from 'lucide-react';

interface WinnerHistoryModalProps {
  history: WinnerRecord[];
  onClose: () => void;
  onClearHistory: () => void;
  onRestoreWinner: (item: WheelItem) => void;
}

export const WinnerHistoryModal: React.FC<WinnerHistoryModalProps> = ({
  history,
  onClose,
  onClearHistory,
  onRestoreWinner,
}) => {
  const handleExportText = () => {
    if (history.length === 0) return;
    const lines = [
      '=== ประวัติการจับรางวัล Lucky Draw ===',
      `ส่งออกเมื่อ: ${new Date().toLocaleString('th-TH')}`,
      '',
      ...history.map(
        (rec) =>
          `รอบที่ ${rec.round}: ${rec.item.text} (${new Date(
            rec.timestamp
          ).toLocaleString('th-TH')}) [${rec.presetName}]`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucky-draw-history-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[90dvh] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">
              ประวัติผู้ชนะรางวัล ({history.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Winner records list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[400px] scrollbar-thin">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">ยังไม่มีประวัติการจับรางวัล</p>
              <p className="text-xs mt-1 text-slate-600">
                เมื่อหมุนวงล้อแล้ว รายชื่อผู้โชคดีจะถูกบันทึกที่นี่
              </p>
            </div>
          ) : (
            history.map((record) => {
              const dateStr = new Date(record.timestamp).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/30">
                      #{record.round}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: record.item.color }}
                        />
                        <span className="font-bold text-sm text-slate-100 truncate">
                          {record.item.text}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {record.presetName} • {dateStr} น.
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Re-export Certificate PNG */}
                    <button
                      onClick={() =>
                        exportWinnerCertificate(record, record.presetName)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                      title="ส่งออกภาพเกียรติบัตร"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Restore to wheel */}
                    <button
                      onClick={() => onRestoreWinner(record.item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 text-xs font-medium border border-indigo-500/40 transition cursor-pointer"
                      title="ดึงรายชื่อนี้กลับไปใส่ในวงล้อ"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>คืนสิทธิ์</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <button
              onClick={handleExportText}
              className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>ส่งออกไฟล์ข้อความ (.txt)</span>
            </button>
            <button
              onClick={() => {
                if (confirm('คุณต้องการล้างประวัติผู้ชนะทั้งหมดใช่หรือไม่?')) {
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างประวัติ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
