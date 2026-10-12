import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../services/firebaseService';
import { LogIn, LogOut, Cloud, Check, User as UserIcon } from 'lucide-react';

interface AuthButtonProps {
  user: User | null;
  isSyncing?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ user, isSyncing = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOutUser();
  };

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition cursor-pointer active:scale-95 min-h-[36px]"
        title="เข้าสู่ระบบด้วย Google เพื่อบันทึกพรีเซ็ตและประวัติขึ้น Cloud Firebase"
      >
        <LogIn className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">
          {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ซิงค์ Cloud'}
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/90 text-xs font-medium text-slate-200 transition cursor-pointer min-h-[36px]"
        title={`เข้าสู่ระบบแล้ว: ${user.displayName || user.email || 'ผู้ใช้งาน'}`}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-6 h-6 rounded-full object-cover border border-amber-400/50"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <span className="hidden sm:inline max-w-[90px] truncate text-slate-200 font-medium">
          {user.displayName?.split(' ')[0] || 'บัญชีฉัน'}
        </span>
        <span
          className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
          title="เชื่อมต่อ Firebase สำเร็จ"
        />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700/90 p-3 shadow-2xl text-slate-100 z-40 flex flex-col gap-2.5 animate-in fade-in zoom-in-95">
            <div className="border-b border-slate-800 pb-2">
              <div className="font-semibold text-xs text-white truncate">
                {user.displayName || 'ผู้ใช้งาน'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user.email}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-medium">
                <Cloud className="w-3.5 h-3.5" />
                <span>เชื่อมต่อ Firebase Cloud แล้ว</span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full p-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
