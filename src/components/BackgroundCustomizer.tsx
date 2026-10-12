import React, { useRef } from 'react';
import { BackgroundConfig } from '../types/wheel';
import { Image, Upload, RotateCcw, Sliders, Sparkles, X } from 'lucide-react';

interface BackgroundCustomizerProps {
  config: BackgroundConfig;
  onChange: (config: BackgroundConfig) => void;
  onClose: () => void;
}

const PRESET_BACKGROUNDS = [
  {
    id: 'casino',
    name: 'คาสิโนหรูหรา (Casino Velvet)',
    preview: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #0f172a 100%)',
    css: 'radial-gradient(ellipse at top, #065f46 0%, #022c22 45%, #051614 100%)',
  },
  {
    id: 'cyberpunk',
    name: 'นีออนไซเบอร์ (Cyberpunk)',
    preview: 'linear-gradient(135deg, #311042 0%, #170b28 50%, #070719 100%)',
    css: 'radial-gradient(circle at 50% 30%, #4a0e4e 0%, #190933 50%, #060216 100%)',
  },
  {
    id: 'nebula',
    name: 'กาแล็กซี่คอสมิก (Cosmic Star)',
    preview: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
    css: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
  },
  {
    id: 'party',
    name: 'ปาร์ตี้คอนเฟตติ (Festive Confetti)',
    preview: 'linear-gradient(135deg, #701a75 0%, #431407 50%, #0f172a 100%)',
    css: 'radial-gradient(circle at 70% 20%, #701a75 0%, #431407 40%, #0b0f19 100%)',
  },
  {
    id: 'slate',
    name: 'ดาร์กมินิมอล (Dark Studio)',
    preview: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
    css: 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
  },
  {
    id: 'sunset',
    name: 'อาทิตย์อัสดง (Sunset Amber)',
    preview: 'linear-gradient(135deg, #7c2d12 0%, #4c1d95 60%, #09090b 100%)',
    css: 'radial-gradient(circle at top, #7c2d12 0%, #3b0764 50%, #09090b 100%)',
  },
];

export const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
  config,
  onChange,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    // Limit to reasonable size (~5MB) to keep localStorage safe
    if (file.size > 6 * 1024 * 1024) {
      alert('ไฟล์รูปภาพมีขนาดใหญ่เกิน 6MB กรุณาเลือกภาพที่มีขนาดเล็กลง');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange({
        ...config,
        type: 'custom',
        customDataUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    onChange({
      type: 'preset',
      presetId: 'nebula',
      customDataUrl: undefined,
      blur: 0,
      dimOverlay: 40,
      brightness: 100,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">ปรับแต่งภาพพื้นหลัง</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Custom Image Upload Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            อัปโหลดภาพจากเครื่องของคุณเอง
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-800/40 hover:bg-slate-800/80 text-sm font-medium text-slate-300 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>
                {config.type === 'custom' && config.customDataUrl
                  ? 'เปลี่ยนรูปภาพพื้นหลังใหม่...'
                  : 'เลือกรูปภาพพื้นหลัง (PNG, JPG)...'}
              </span>
            </button>

            {config.type === 'custom' && config.customDataUrl && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <span className="text-emerald-400 font-medium">✓ กำลังใช้ภาพพื้นหลังที่คุณอัปโหลด</span>
                <button
                  onClick={() =>
                    onChange({
                      ...config,
                      type: 'preset',
                      customDataUrl: undefined,
                    })
                  }
                  className="text-red-400 hover:underline cursor-pointer"
                >
                  ยกเลิกภาพนี้
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Preset Wallpaper Choices */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            หรือเลือกภาพธีมสำเร็จรูป
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_BACKGROUNDS.map((bg) => {
              const isSelected = config.type === 'preset' && config.presetId === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() =>
                    onChange({
                      ...config,
                      type: 'preset',
                      presetId: bg.id,
                    })
                  }
                  className={`flex flex-col items-start p-2 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'
                  }`}
                >
                  <div
                    className="w-full h-12 rounded-lg mb-1.5 border border-white/10"
                    style={{ background: bg.preview }}
                  />
                  <span className="text-xs font-medium text-slate-200 truncate w-full">
                    {bg.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Sliders: Blur & Dim Overlay */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>ปรับแต่งความเบลอและแสงมืด</span>
          </div>

          {/* Dim Overlay */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>ความมืดของพื้นหลัง (Dim Overlay)</span>
              <span>{config.dimOverlay}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              value={config.dimOverlay}
              onChange={(e) =>
                onChange({ ...config, dimOverlay: Number(e.target.value) })
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Blur Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>ความเบลอ (Blur Effect)</span>
              <span>{config.blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={config.blur}
              onChange={(e) =>
                onChange({ ...config, blur: Number(e.target.value) })
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตเป็นค่าเริ่มต้น</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-sm transition cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};

export function getBackgroundStyle(config: BackgroundConfig): React.CSSProperties {
  if (config.type === 'custom' && config.customDataUrl) {
    return {
      backgroundImage: `url(${config.customDataUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  const found = PRESET_BACKGROUNDS.find((p) => p.id === config.presetId);
  return {
    background: found ? found.css : PRESET_BACKGROUNDS[2].css,
    backgroundAttachment: 'fixed',
  };
}
