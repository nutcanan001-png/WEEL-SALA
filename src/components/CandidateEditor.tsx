import React, { useState } from 'react';
import { WheelItem } from '../types/wheel';
import { COLOR_PALETTES } from '../utils/colorPalettes';
import {
  Plus,
  Trash2,
  Shuffle,
  Palette,
  ClipboardList,
  CheckCircle2,
  Circle,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface CandidateEditorProps {
  items: WheelItem[];
  onItemsChange: (items: WheelItem[]) => void;
  disabled?: boolean;
}

export const CandidateEditor: React.FC<CandidateEditorProps> = ({
  items,
  onItemsChange,
  disabled = false,
}) => {
  const [newText, setNewText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'append' | 'replace'>('append');
  const [selectedPaletteId, setSelectedPaletteId] = useState('rainbow');

  // Add single item
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;

    const currentPalette =
      COLOR_PALETTES.find((p) => p.id === selectedPaletteId) || COLOR_PALETTES[0];
    const nextColor =
      currentPalette.colors[items.length % currentPalette.colors.length] || selectedColor;

    const newItem: WheelItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      color: nextColor,
      weight: 1,
      enabled: true,
    };

    onItemsChange([...items, newItem]);
    setNewText('');

    // Advance selected color to next swatch
    const nextIdx = (items.length + 1) % currentPalette.colors.length;
    setSelectedColor(currentPalette.colors[nextIdx]);
  };

  // Update item text
  const handleUpdateText = (id: string, text: string) => {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, text } : it)));
  };

  // Update item color
  const handleUpdateColor = (id: string, color: string) => {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, color } : it)));
  };

  // Toggle item enabled
  const handleToggleEnable = (id: string) => {
    onItemsChange(
      items.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it))
    );
  };

  // Delete single item
  const handleDeleteItem = (id: string) => {
    onItemsChange(items.filter((it) => it.id !== id));
  };

  // Shuffle order
  const handleShuffle = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    onItemsChange(shuffled);
  };

  // Sort A-Z
  const handleSort = () => {
    const sorted = [...items].sort((a, b) => a.text.localeCompare(b.text, 'th'));
    onItemsChange(sorted);
  };

  // Apply palette to all items
  const handleApplyPalette = (paletteId: string) => {
    setSelectedPaletteId(paletteId);
    const pal = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (!pal) return;

    const updated = items.map((it, idx) => ({
      ...it,
      color: pal.colors[idx % pal.colors.length],
    }));
    onItemsChange(updated);
  };

  // Bulk add modal execution
  const handleBulkSubmit = () => {
    const lines = bulkText
      .split(/[\r\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (lines.length === 0) {
      setShowBulkModal(false);
      return;
    }

    const currentPalette =
      COLOR_PALETTES.find((p) => p.id === selectedPaletteId) || COLOR_PALETTES[0];

    const newItemsList: WheelItem[] = lines.map((text, idx) => ({
      id: `bulk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      color: currentPalette.colors[idx % currentPalette.colors.length],
      weight: 1,
      enabled: true,
    }));

    if (bulkMode === 'replace') {
      onItemsChange(newItemsList);
    } else {
      onItemsChange([...items, ...newItemsList]);
    }

    setBulkText('');
    setShowBulkModal(false);
  };

  // Clear all items
  const handleClearAll = () => {
    if (confirm('คุณต้องการลบรายชื่อทั้งหมดใช่หรือไม่?')) {
      onItemsChange([]);
    }
  };

  const activeCount = items.filter((it) => it.enabled).length;

  return (
    <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>รายชื่อผู้เข้าร่วม / ช่องวงล้อ</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              {activeCount} / {items.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            เพิ่ม แก้ไขชื่อ และเปลี่ยนสีของแต่ละช่องได้อิสระ
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
            title="เพิ่มรายชื่อจำนวนมากทีละหลายรายการ"
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">ใส่หลายชื่อ</span>
          </button>
          <button
            onClick={handleShuffle}
            disabled={disabled || items.length < 2}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer disabled:opacity-40"
            title="สลับตำแหน่งช่องวงล้อแบบสุ่ม"
          >
            <Shuffle className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={handleSort}
            disabled={disabled || items.length < 2}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer disabled:opacity-40"
            title="เรียงลำดับตามตัวอักษร"
          >
            <ArrowUpDown className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Palette Selector Bar */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>ธีมสี:</span>
        </span>
        <div className="flex items-center gap-1.5">
          {COLOR_PALETTES.map((pal) => (
            <button
              key={pal.id}
              onClick={() => handleApplyPalette(pal.id)}
              disabled={disabled}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition cursor-pointer shrink-0 ${
                selectedPaletteId === pal.id
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={`ปรับใช้ชุดสี ${pal.name}`}
            >
              <div className="flex -space-x-1">
                {pal.colors.slice(0, 3).map((c, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-black/40"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="truncate max-w-[90px]">{pal.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input box to add single candidate */}
      <form onSubmit={handleAddItem} className="p-3 border-b border-slate-800 flex gap-2">
        {/* Color picker for next item */}
        <div className="relative flex items-center">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            disabled={disabled}
            className="w-10 h-10 rounded-xl cursor-pointer border border-slate-700 bg-transparent p-0.5"
            title="เลือกสีสำหรับช่องใหม่"
          />
        </div>

        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          disabled={disabled}
          placeholder="พิมพ์ชื่อคน / ของรางวัล..."
          className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[44px]"
        />

        <button
          type="submit"
          disabled={disabled || !newText.trim()}
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-semibold text-white shadow-md transition cursor-pointer active:scale-95 min-h-[44px] min-w-[48px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">เพิ่ม</span>
        </button>
      </form>

      {/* Candidate Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 max-h-[420px] sm:max-h-[480px] scrollbar-thin">
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">ยังไม่มีรายชื่อในวงล้อ</p>
            <p className="text-xs mt-1 text-slate-600">
              พิมพ์ชื่อเพิ่มด้านบน หรือกด "ใส่หลายชื่อ" เพื่อนำเข้า
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                item.enabled
                  ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                  : 'bg-slate-900/40 border-slate-800/40 opacity-50'
              }`}
            >
              {/* Enable / Disable toggle button */}
              <button
                type="button"
                onClick={() => handleToggleEnable(item.id)}
                disabled={disabled}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-400 cursor-pointer shrink-0 rounded-lg active:bg-slate-700/50"
                title={item.enabled ? 'ปิดใช้งานชั่วคราว' : 'เปิดใช้งาน'}
              >
                {item.enabled ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {/* Index badge */}
              <span className="text-xs font-mono font-medium text-slate-500 w-5 text-center shrink-0">
                {index + 1}
              </span>

              {/* Color swatch / native picker */}
              <div className="relative shrink-0 flex items-center">
                <input
                  type="color"
                  value={item.color}
                  onChange={(e) => handleUpdateColor(item.id, e.target.value)}
                  disabled={disabled}
                  className="w-7 h-7 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0"
                  title="คลิกเพื่อเปลี่ยนสีช่องนี้"
                />
              </div>

              {/* Editable Name */}
              <input
                type="text"
                value={item.text}
                onChange={(e) => handleUpdateText(item.id, e.target.value)}
                disabled={disabled}
                className="flex-1 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-400 focus:outline-none px-1.5 py-1 text-sm text-slate-200 min-h-[36px]"
              />

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                disabled={disabled}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer shrink-0 active:bg-red-500/20"
                title="ลบรายการนี้"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer controls */}
      {items.length > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>รวมทั้งหมด {items.length} รายการ</span>
          <button
            onClick={handleClearAll}
            disabled={disabled}
            className="text-red-400 hover:text-red-300 transition cursor-pointer hover:underline p-1"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <span>เพิ่มรายชื่อจำนวนมาก (Bulk Add)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                วางรายชื่อที่ต้องการ 1 บรรทัดต่อ 1 รายชื่อ หรือคั่นด้วยเครื่องหมายจุลภาค (,)
              </p>
            </div>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="สมชาย&#10;สมหญิง&#10;กานดา&#10;iPhone 16&#10;ทองคำ 1 สลึง"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
            />

            <div className="flex items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="radio"
                    name="bulkMode"
                    checked={bulkMode === 'append'}
                    onChange={() => setBulkMode('append')}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span>เพิ่มต่อจากของเดิม</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="radio"
                    name="bulkMode"
                    checked={bulkMode === 'replace'}
                    onChange={() => setBulkMode('replace')}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span>แทนที่รายการเดิมทั้งหมด</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition cursor-pointer min-h-[44px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition cursor-pointer min-h-[44px]"
              >
                บันทึกลงวงล้อ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
