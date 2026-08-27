import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  FileCode,
  Table,
  Printer,
  ShieldCheck,
  BarChart3,
  BellRing,
  Sun,
  Moon
} from 'lucide-react';
import { SMKN_LOGO_URL } from '../constants/agendaData';
import { ThemeMode } from '../types';

export type ActiveTabType = 'form' | 'spreadsheet' | 'reports' | 'notifications' | 'script' | 'print';

interface HeaderProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  totalEntries: number;
  isAppsScriptConnected: boolean;
  notificationEnabled?: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalEntries,
  isAppsScriptConnected,
  notificationEnabled = true,
  theme,
  onToggleTheme
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navTabs = [
    { id: 'form' as ActiveTabType, label: 'Input Agenda', icon: Sparkles, badge: null, shortcut: 'Ctrl+1', keyDigit: '1' },
    { id: 'spreadsheet' as ActiveTabType, label: 'Rekap Jurnal', icon: Table, badge: totalEntries > 0 ? String(totalEntries) : null, shortcut: 'Ctrl+2', keyDigit: '2' },
    { id: 'reports' as ActiveTabType, label: 'Laporan & Rekap', icon: BarChart3, badge: null, shortcut: 'Ctrl+3', keyDigit: '3' },
    { id: 'notifications' as ActiveTabType, label: 'Notifikasi & Jadwal', icon: BellRing, isNotif: true, shortcut: 'Ctrl+4', keyDigit: '4' },
    { id: 'script' as ActiveTabType, label: 'Script Code.gs', icon: FileCode, badge: null, shortcut: 'Ctrl+5', keyDigit: '5' },
    { id: 'print' as ActiveTabType, label: 'Cetak Jurnal', icon: Printer, badge: null, shortcut: 'Ctrl+6', keyDigit: '6' },
  ];

  const isLight = theme === 'light';

  return (
    <header className="w-full mb-6 no-print">
      {/* Top Bar Container */}
      <div
        className={`rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-200 relative overflow-hidden ${
          isLight
            ? 'bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-200/50'
            : 'bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl'
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div
          className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${
            isLight ? 'bg-emerald-500/10' : 'bg-emerald-600/10'
          }`}
        />
        <div
          className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20 ${
            isLight ? 'bg-amber-500/10' : 'bg-amber-500/5'
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            {/* Official SMKN Bojonggambir Logo */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl p-1.5 shadow-md flex items-center justify-center shrink-0 border ${
                isLight
                  ? 'bg-white border-slate-200 shadow-slate-200'
                  : 'bg-white/95 border-slate-200/40'
              }`}
            >
              <img
                src={SMKN_LOGO_URL}
                alt="Logo SMKN Bojonggambir"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <span
                  className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase whitespace-nowrap border ${
                    isLight
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  Kurikulum Merdeka
                </span>
                <span
                  className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium flex items-center gap-1 whitespace-nowrap border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-emerald-900/60 text-emerald-200 border-emerald-700/40'
                  }`}
                >
                  <ShieldCheck
                    className={`w-3 h-3 shrink-0 ${
                      isLight ? 'text-emerald-600' : 'text-emerald-400'
                    }`}
                  />
                  <span>SMK Negeri Bojonggambir</span>
                </span>
              </div>

              <h1
                className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-brand truncate ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                AGENDA KELAS
              </h1>
              <p
                className={`text-xs sm:text-sm font-medium tracking-normal truncate ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Jurnal Mengajar Harian, Pengingat Jadwal & Rekapitulasi Pembelajaran
              </p>
            </div>
          </div>

          {/* Right Section: Realtime Clock, Status, & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-stretch lg:self-auto justify-between lg:justify-end">
            
            {/* Clock & Status Container */}
            <div
              className={`flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3.5 rounded-xl border shrink-0 flex-1 lg:flex-initial ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 font-semibold text-xs sm:text-sm ${
                  isLight ? 'text-amber-800' : 'text-amber-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{currentDate || 'Memuat...'}</span>
              </div>

              <div
                className={`flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="tracking-wider">{currentTime || '--:--:-- WIB'}</span>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Status:</span>
                {isAppsScriptConnected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Tersambung
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
                      isLight ? 'text-amber-700' : 'text-amber-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Lokal
                  </span>
                )}
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 shrink-0 ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
              title={isLight ? 'Ganti ke Mode Gelap (Dark Mode)' : 'Ganti ke Mode Terang (Light Mode)'}
              aria-label="Ubah Tema Tampilan"
            >
              {isLight ? (
                <>
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">Gelap</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300 hidden sm:inline">Terang</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`mt-4 pt-3.5 border-t ${
            isLight ? 'border-slate-200' : 'border-slate-800/80'
          }`}
        >
          <nav
            aria-label="Navigasi Menu Utama"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 custom-scrollbar"
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={`Buka ${tab.label} (Shortcut: ${tab.shortcut})`}
                  className={`min-h-[42px] px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 group ${
                    isActive
                      ? isLight
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-800'
                        : 'bg-emerald-600 text-white shadow-md shadow-emerald-950 border border-emerald-400/30'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? isLight ? 'text-amber-200' : 'text-amber-300'
                        : tab.isNotif && notificationEnabled
                        ? 'text-amber-500 animate-pulse'
                        : isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? isLight ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-800 text-emerald-100'
                          : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {/* Subtle keyboard shortcut hint */}
                  <span
                    className={`hidden md:inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded border transition-opacity ${
                      isActive
                        ? isLight
                          ? 'bg-emerald-800/70 text-emerald-100 border-emerald-900/50'
                          : 'bg-emerald-950/60 text-emerald-200 border-emerald-800/40'
                        : isLight
                        ? 'bg-slate-200 text-slate-500 border-slate-300 opacity-60 group-hover:opacity-100'
                        : 'bg-slate-900 text-slate-400 border-slate-700 opacity-60 group-hover:opacity-100'
                    }`}
                  >
                    {tab.shortcut}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
};
