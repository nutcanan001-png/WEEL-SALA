import React, { useState } from 'react';
import { WheelPreset, WheelItem } from '../types/wheel';
import {
  Bookmark,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Check,
  Star,
  FileJson,
} from 'lucide-react';

interface PresetManagerProps {
  presets: WheelPreset[];
  activePresetId: string;
  currentItems: WheelItem[];
  onSelectPreset: (preset: WheelPreset) => void;
  onSavePreset: (name: string, items: WheelItem[]) => void;
  onDeletePreset: (presetId: string) => void;
  onImportPresets: (imported: WheelPreset[]) => void;
  disabled?: boolean;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  activePresetId,
  currentItems,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  onImportPresets,
  disabled = false,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Save current wheel as a new preset
  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPresetName.trim();
    if (!trimmed) return;

    onSavePreset(trimmed, currentItems);
    setNewPresetName('');
    setShowSaveDialog(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Export all presets or active preset to JSON
  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(presets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `lucky-wheel-presets-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportPresets(parsed);
            alert(`นำเข้าสำเร็จ ${parsed.length} รายการโปรด!`);
          } else if (parsed && parsed.items) {
            onImportPresets([parsed]);
            alert('นำเข้าสำเร็จ 1 รายการโปรด!');
          }
        } catch {
          alert('ไฟล์ JSON ไม่ถูกต้อง โปรดตรวจสอบรูปแบบไฟล์');
        }
      };
    }
  };

  return (
    <div className="flex flex-col bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          <h2 className="text-base font-bold text-slate-100">
            รายการโปรด & พรีเซ็ต (Favorites)
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={disabled || currentItems.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-40"
            title="บันทึกรายการปัจจุบันเป็นรายการโปรดใหม่"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>บันทึกรายการนี้</span>
          </button>
        </div>
      </div>

      {/* Preset List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto scrollbar-thin">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`group relative flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{preset.name}</span>
                  {preset.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      แนะนำ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{preset.items.length} รายการ</span>
                  {/* Colors preview pills */}
                  <div className="flex -space-x-1">
                    {preset.items.slice(0, 5).map((it, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-black/50"
                        style={{ backgroundColor: it.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons on preset */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-80 sm:group-hover:opacity-100">
                {!preset.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`ลบรายการโปรด "${preset.name}"?`)) {
                        onDeletePreset(preset.id);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition cursor-pointer"
                    title="ลบรายการโปรด"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isActive && <Check className="w-5 h-5 text-indigo-400 shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* JSON Backup & Restore Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        <span className="text-[11px] text-slate-500">บันทึกอัตโนมัติบนอุปกรณ์</span>

        <div className="flex items-center gap-3">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:text-amber-400 transition cursor-pointer"
            title="ส่งออกรายการโปรดทั้งหมดเป็นไฟล์ JSON"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>ส่งออก JSON</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:text-amber-400 transition cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>นำเข้า JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Save Preset Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <form
            onSubmit={handleSaveCurrent}
            className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <span>บันทึกเป็นรายการโปรด (Save Favorite)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                บันทึกรายชื่อและสีสัน {currentItems.length} ช่องปัจจุบันไว้เปิดใช้วันหลัง
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                ชื่อรายการโปรด
              </label>
              <input
                type="text"
                autoFocus
                required
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="เช่น จับฉลากปีใหม่แผนกบัญชี, เมนูอาหารประจำวัน"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 min-h-[44px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition cursor-pointer min-h-[44px]"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition cursor-pointer min-h-[44px]"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
