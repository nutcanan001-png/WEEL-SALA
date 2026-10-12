import { WheelPreset } from '../types/wheel';

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'rainbow',
    name: 'สายรุ้งสดใส (Rainbow)',
    colors: [
      '#EF4444', // Red
      '#F97316', // Orange
      '#EAB308', // Yellow
      '#10B981', // Green
      '#06B6D4', // Cyan
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#EC4899', // Pink
    ],
  },
  {
    id: 'cyberpunk',
    name: 'นีออนไซเบอร์ (Neon Glow)',
    colors: [
      '#FF0055', // Neon Pink
      '#00F0FF', // Cyan
      '#FFE600', // Neon Yellow
      '#7928CA', // Deep Violet
      '#00FF66', // Toxic Green
      '#FF5E00', // Neon Orange
      '#0070F3', // Electric Blue
      '#9B51E0', // Neon Purple
    ],
  },
  {
    id: 'pastel',
    name: 'พาสเทลมินิมอล (Soft Pastel)',
    colors: [
      '#FCA5A5', // Pastel Red
      '#FDBA74', // Pastel Orange
      '#FDE047', // Pastel Yellow
      '#86EFAC', // Pastel Green
      '#67E8F9', // Pastel Cyan
      '#93C5FD', // Pastel Blue
      '#C4B5FD', // Pastel Purple
      '#F472B6', // Pastel Pink
    ],
  },
  {
    id: 'luxury-gold',
    name: 'ทองคำหรูหรา (Royal Gold)',
    colors: [
      '#D97706', // Gold
      '#1E293B', // Slate Dark
      '#F59E0B', // Amber
      '#0F172A', // Midnight
      '#B45309', // Dark Bronze
      '#334155', // Charcoal
      '#FBBF24', // Light Gold
      '#1E1B4B', // Royal Navy
    ],
  },
  {
    id: 'ocean',
    name: 'คลื่นทะเล (Ocean Breeze)',
    colors: [
      '#0284C7', // Sky Blue
      '#0D9488', // Teal
      '#2563EB', // Blue
      '#06B6D4', // Cyan
      '#3B82F6', // Blue 500
      '#14B8A6', // Teal 500
      '#1D4ED8', // Navy Blue
      '#38BDF8', // Light Sky
    ],
  },
  {
    id: 'carnival',
    name: 'คาร์นิวัลปาร์ตี้ (Carnival)',
    colors: [
      '#DC2626', // Crimson
      '#FBBF24', // Yellow Gold
      '#7C3AED', // Violet
      '#059669', // Emerald
      '#EA580C', // Tangerine
      '#DB2777', // Fuchsia
      '#0284C7', // Azure
      '#65A30D', // Lime
    ],
  },
  {
    id: 'duo-red-gold',
    name: 'สลับ แดง-ทอง (Red & Gold)',
    colors: ['#DC2626', '#F59E0B'],
  },
  {
    id: 'duo-indigo-cyan',
    name: 'สลับ กรมท่า-ฟ้า (Navy & Cyan)',
    colors: ['#1E1B4B', '#06B6D4'],
  },
];

/**
 * Calculates relative luminance to pick white or black text for maximum contrast.
 */
export function getContrastingTextColor(hexColor: string): '#FFFFFF' | '#111827' {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  // Standard luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#111827' : '#FFFFFF';
}

/**
 * Default preset wheels
 */
export const DEFAULT_PRESETS: WheelPreset[] = [
  {
    id: 'preset-newyear-gifts',
    name: '🎁 ของขวัญปีใหม่ & สุ่มรางวัลใหญ่',
    description: 'รางวัลจับฉลากยอดนิยมสำหรับงานเลี้ยงและเทศกาล',
    createdAt: Date.now(),
    isDefault: true,
    items: [
      { id: 'item-1', text: 'ทองคำ 1 สลึง 👑', color: '#F59E0B', weight: 1, enabled: true },
      { id: 'item-2', text: 'iPhone 16 Pro 📱', color: '#DC2626', weight: 1, enabled: true },
      { id: 'item-3', text: 'บัตรกำนัล 2,000฿ 💳', color: '#2563EB', weight: 1, enabled: true },
      { id: 'item-4', text: 'หูฟังไร้สาย AirPods 🎧', color: '#10B981', weight: 1, enabled: true },
      { id: 'item-5', text: 'หม้อทอดไร้น้ำมัน 🍳', color: '#8B5CF6', weight: 1, enabled: true },
      { id: 'item-6', text: 'กล่องสุ่มพรีเมียม 📦', color: '#EC4899', weight: 1, enabled: true },
      { id: 'item-7', text: 'แก้วน้ำเก็บความเย็น 🥤', color: '#06B6D4', weight: 1, enabled: true },
      { id: 'item-8', text: 'บัตรชมภาพยนตร์ 2 ใบ 🎬', color: '#F97316', weight: 1, enabled: true },
    ],
  },
  {
    id: 'preset-lunch-ideas',
    name: '🍜 มื้อนี้กินอะไรดี?',
    description: 'แก้ปัญหาโลกแตก คิดไม่ออกว่าจะกินอะไรดี',
    createdAt: Date.now(),
    isDefault: true,
    items: [
      { id: 'food-1', text: 'กะเพราหมูกรอบไข่ดาว', color: '#EF4444', weight: 1, enabled: true },
      { id: 'food-2', text: 'ก๋วยเตี๋ยวเรือน้ำตก', color: '#F97316', weight: 1, enabled: true },
      { id: 'food-3', text: 'ส้มตำ ไก่ย่าง ข้าวเหนียว', color: '#EAB308', weight: 1, enabled: true },
      { id: 'food-4', text: 'ข้าวมันไก่ตอน', color: '#10B981', weight: 1, enabled: true },
      { id: 'food-5', text: 'ราเมน / อาหารญี่ปุ่น', color: '#06B6D4', weight: 1, enabled: true },
      { id: 'food-6', text: 'ชาบู สุกี้ หม้อไฟ', color: '#3B82F6', weight: 1, enabled: true },
      { id: 'food-7', text: 'ข้าวขาหมูคากิ', color: '#8B5CF6', weight: 1, enabled: true },
      { id: 'food-8', text: 'สลัดสุขภาพ / แซนด์วิช', color: '#EC4899', weight: 1, enabled: true },
    ],
  },
  {
    id: 'preset-lucky-numbers',
    name: '🎲 ตัวเลขนำโชค (1 - 10)',
    description: 'สุ่มตัวเลข 1 ถึง 10 สำหรับเกมหรือการจัดลำดับ',
    createdAt: Date.now(),
    isDefault: true,
    items: Array.from({ length: 10 }, (_, i) => ({
      id: `num-${i + 1}`,
      text: `เลข ${i + 1}`,
      color: COLOR_PALETTES[0].colors[i % COLOR_PALETTES[0].colors.length],
      weight: 1,
      enabled: true,
    })),
  },
  {
    id: 'preset-party-truth-dare',
    name: '🎯 บทลงโทษปาร์ตี้สุดฮา',
    description: 'เกมสนุกๆ เพิ่มเสียงหัวเราะในวงเพื่อนฝูง',
    createdAt: Date.now(),
    isDefault: true,
    items: [
      { id: 'dare-1', text: 'เต้นเพลงฮิต 30 วินาที 💃', color: '#EC4899', weight: 1, enabled: true },
      { id: 'dare-2', text: 'เล่าความลับน่าอาย 1 เรื่อง 🤫', color: '#8B5CF6', weight: 1, enabled: true },
      { id: 'dare-3', text: 'ดื่มน้ำรวดเดียวหมดแก้ว 🥤', color: '#06B6D4', weight: 1, enabled: true },
      { id: 'dare-4', text: 'วิดพื้น 10 ครั้ง 💪', color: '#10B981', weight: 1, enabled: true },
      { id: 'dare-5', text: 'ร้องเพลงท่อนฮุกแบบใส่อารมณ์ 🎤', color: '#F59E0B', weight: 1, enabled: true },
      { id: 'dare-6', text: 'รอดตัว! ส่งต่อให้คนซ้ายมือ 🎉', color: '#22C55E', weight: 1, enabled: true },
    ],
  },
];
