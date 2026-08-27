import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, ActiveTabType } from './components/Header';
import { AgendaForm } from './components/AgendaForm';
import { SpreadsheetView } from './components/SpreadsheetView';
import { AppsScriptGuideModal } from './components/AppsScriptGuideModal';
import { PrintAgendaDoc } from './components/PrintAgendaDoc';
import { NotificationManager } from './components/NotificationManager';
import { ReportDashboard } from './components/ReportDashboard';
import { PrintReportDoc } from './components/PrintReportDoc';
import { AgendaEntry, AppsScriptConfig, NotificationSettings, ReportFilter, ThemeMode } from './types';
import { parseJamKe, playNotificationChime } from './utils/agendaUtils';
import { SMKN_LOGO_URL } from './constants/agendaData';
import {
  Calendar,
  Layers,
  Award,
  CheckCircle2,
  X,
  ArrowRight,
  Command,
  Keyboard,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

const STORAGE_KEY_AGENDA = 'SMKN_BOJONGGAMBIR_AGENDA_DATA_V1';
const STORAGE_KEY_CONFIG = 'SMKN_BOJONGGAMBIR_SCRIPT_CONFIG_V1';
const STORAGE_KEY_NOTIF = 'SMKN_BOJONGGAMBIR_NOTIF_SETTINGS_V1';
const STORAGE_KEY_THEME = 'SMKN_BOJONGGAMBIR_THEME_V1';

export interface ToastState {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
  entry?: AgendaEntry;
}

// Initial sample data tailored for SMKN Bojonggambir
const INITIAL_SAMPLE_ENTRIES: AgendaEntry[] = [
  {
    id: 'AGENDA-1724749200001',
    timestamp: new Date().toISOString(),
    hari: 'Senin',
    tanggal: new Date().toISOString().split('T')[0],
    jamKe: 'Jam 1 s/d 3',
    namaGuru: 'Ruli',
    jurusan: 'DKV',
    kelas: 'X DKV 1',
    mataPelajaran: 'Dasar-dasar Kejuruan DKV',
    tujuan: 'Peserta didik mampu memahami prinsip dasar tipografi dan merancang hirarki teks pada media publikasi digital secara kreatif.',
    modelMetode: 'PJBL',
    asesmenFormatif: ['Tanya', 'Jawab', 'Quiz'],
    asesmenSumatif: ['Projek', 'Observasi Produk'],
    kehadiran: { hadir: 34, sakit: 1, izin: 1, alfa: 0 },
    catatanKejadian: 'Semua kelompok aktif merancang poster infografis tipografi di lab komputer.',
    statusKirim: 'Tersimpan Lokal'
  },
  {
    id: 'AGENDA-1724749200002',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    hari: 'Jumat',
    tanggal: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    jamKe: 'Jam 4 s/d 6',
    namaGuru: 'Dini',
    jurusan: 'APHP',
    kelas: 'XI APHP',
    mataPelajaran: 'Produksi Pengolahan Hasil Nabati',
    tujuan: 'Peserta didik mampu mempraktikkan proses pengolahan sari buah lokal dan menerapkan standar pengawasan mutu keamanan pangan (HACCP).',
    modelMetode: 'PBL',
    asesmenFormatif: ['Observasi Sikap / Keaktifan', 'Tanya'],
    asesmenSumatif: ['Praktik', 'Portofolio'],
    kehadiran: { hadir: 32, sakit: 2, izin: 0, alfa: 0 },
    catatanKejadian: 'Praktik pengolahan hasil panen perkebunan berjalan sesuai SOP sanitasi.',
    statusKirim: 'Tersimpan Lokal'
  },
  {
    id: 'AGENDA-1724749200003',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    hari: 'Kamis',
    tanggal: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    jamKe: 'Jam 7 s/d 8',
    namaGuru: 'Aa Mansur',
    jurusan: 'DKV',
    kelas: 'XII DKV 2',
    mataPelajaran: 'Desain Publikasi & Branding',
    tujuan: 'Peserta didik mampu menyusun panduan identitas visual merek (Brand Guidelines) UMKM Bojonggambir.',
    modelMetode: 'PJBL',
    asesmenFormatif: ['Penilaian Antarteman', 'Jawab'],
    asesmenSumatif: ['Portofolio', 'Perform'],
    kehadiran: { hadir: 36, sakit: 0, izin: 0, alfa: 0 },
    catatanKejadian: 'Presentasi hasil mockup kemasan produk lokal berlangsung interaktif.',
    statusKirim: 'Tersimpan Lokal'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType | 'print-report'>('form');
  const [entries, setEntries] = useState<AgendaEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [reportFilterForPrint, setReportFilterForPrint] = useState<ReportFilter | undefined>(undefined);
  
  // Theme state: dark (default) or light
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Interactive Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  const [appsScriptConfig, setAppsScriptConfig] = useState<AppsScriptConfig>({
    webAppUrl: '',
    sheetName: 'AGENDA_KELAS_SMKN_BOJONGGAMBIR',
    isAutoSync: true
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    isEnabled: true,
    leadTimeMinutes: 10,
    playAudio: true,
    browserPush: false,
    emailDailyDigest: false,
    selectedGuru: 'Semua'
  });

  // Track notifications already sent today to prevent spam
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }

      const savedEntries = localStorage.getItem(STORAGE_KEY_AGENDA);
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      } else {
        setEntries(INITIAL_SAMPLE_ENTRIES);
        localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(INITIAL_SAMPLE_ENTRIES));
      }

      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) {
        setAppsScriptConfig(JSON.parse(savedConfig));
      }

      const savedNotif = localStorage.getItem(STORAGE_KEY_NOTIF);
      if (savedNotif) {
        setNotificationSettings(JSON.parse(savedNotif));
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
      setEntries(INITIAL_SAMPLE_ENTRIES);
    }
  }, []);

  const handleToggleTheme = () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
  };

  // Keyboard Shortcuts Navigation Listener (Ctrl+1 s/d Ctrl+6, Ctrl+K, Alt+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl or Cmd key is pressed
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('form');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('spreadsheet');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('reports');
            break;
          case '4':
            e.preventDefault();
            setActiveTab('notifications');
            break;
          case '5':
            e.preventDefault();
            setActiveTab('script');
            break;
          case '6':
            e.preventDefault();
            setActiveTab('print');
            break;
          case 'k':
          case '/':
            e.preventDefault();
            setActiveTab('spreadsheet');
            setTimeout(() => {
              const searchEl = document.getElementById('spreadsheet-search-input');
              if (searchEl) searchEl.focus();
            }, 100);
            break;
          default:
            break;
        }
      } else if (e.altKey) {
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          handleToggleTheme();
        } else if (e.key.toLowerCase() === 'k' || e.key === '?') {
          e.preventDefault();
          setShowShortcutModal(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme]);

  // Toast Auto-Dismiss Timer
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Background Notification Interval Checker
  const checkUpcomingClasses = useCallback(() => {
    if (!notificationSettings.isEnabled) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Filter today's entries
    const todayEntries = entries.filter(e => {
      const isToday = e.tanggal === todayStr;
      const matchesTeacher = notificationSettings.selectedGuru === 'Semua' || e.namaGuru === notificationSettings.selectedGuru;
      return isToday && matchesTeacher;
    });

    todayEntries.forEach(entry => {
      const timeSlot = parseJamKe(entry.jamKe);
      const [startHour, startMin] = timeSlot.startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const minutesUntilStart = startMinutes - currentMinutes;

      // Check if we should notify: within leadTime and not past starting time by more than 10 mins
      const notificationKey = `${entry.id}-${todayStr}-${startMinutes}`;
      if (
        minutesUntilStart >= 0 &&
        minutesUntilStart <= notificationSettings.leadTimeMinutes &&
        !notifiedIdsRef.current.has(notificationKey)
      ) {
        notifiedIdsRef.current.add(notificationKey);

        // Play Sound
        if (notificationSettings.playAudio) {
          playNotificationChime();
        }

        // Browser Push Notification
        if (notificationSettings.browserPush && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🔔 Jadwal Mengajar: ${entry.namaGuru}`, {
              body: `Kelas ${entry.kelas} (${entry.mataPelajaran}) akan dimulai dalam ${minutesUntilStart} menit (${timeSlot.startTime} WIB).`,
              icon: SMKN_LOGO_URL
            });
          } catch (err) {
            console.warn('Browser push notification error:', err);
          }
        }
      }
    });
  }, [entries, notificationSettings]);

  useEffect(() => {
    const timer = setInterval(checkUpcomingClasses, 30000); // check every 30 seconds
    return () => clearInterval(timer);
  }, [checkUpcomingClasses]);

  // Save entries to state & local storage & trigger webhook & display Toast feedback
  const handleSaveEntry = async (newEntry: AgendaEntry): Promise<boolean> => {
    let sentToSpreadsheet = false;

    if (appsScriptConfig.webAppUrl.trim()) {
      try {
        await fetch(appsScriptConfig.webAppUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newEntry)
        });
        sentToSpreadsheet = true;
      } catch (err) {
        console.warn('Gagal sinkronisasi ke Webhook Apps Script:', err);
      }
    }

    const updatedEntry: AgendaEntry = {
      ...newEntry,
      statusKirim: sentToSpreadsheet ? 'Terkirim ke Spreadsheet' : 'Tersimpan Lokal'
    };

    const updatedList = [updatedEntry, ...entries];
    setEntries(updatedList);

    try {
      localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to persist to local storage:', e);
    }

    // Play subtle chime on successful save
    if (notificationSettings.playAudio) {
      playNotificationChime();
    }

    // Trigger Rich Toast Notification
    setToast({
      id: 'toast-' + Date.now(),
      type: 'success',
      title: 'Agenda Kelas Berhasil Disimpan!',
      message: `${updatedEntry.kelas} • ${updatedEntry.mataPelajaran} (${updatedEntry.namaGuru})`,
      entry: updatedEntry
    });

    return true;
  };

  // Delete single entry
  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan agenda ini?')) {
      const updatedList = entries.filter((e) => e.id !== id);
      setEntries(updatedList);
      localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(updatedList));
    }
  };

  // Clear all entries
  const handleClearAll = () => {
    if (window.confirm('Perhatian: Anda akan mengosongkan seluruh data agenda kelas di browser ini. Lanjutkan?')) {
      setEntries([]);
      localStorage.removeItem(STORAGE_KEY_AGENDA);
    }
  };

  // Restore entries from JSON backup
  const handleRestoreBackup = (restoredEntries: AgendaEntry[], mode: 'merge' | 'replace') => {
    let updatedList: AgendaEntry[] = [];
    if (mode === 'replace') {
      updatedList = restoredEntries;
    } else {
      const existingIds = new Set(entries.map((e) => e.id));
      const newItems = restoredEntries.filter((e) => !existingIds.has(e.id));
      updatedList = [...newItems, ...entries];
    }

    setEntries(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save restored entries to local storage:', e);
    }
  };

  // Save Config
  const handleSaveConfig = (newConfig: AppsScriptConfig) => {
    setAppsScriptConfig(newConfig);
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
  };

  // Save Notification Settings
  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_NOTIF, JSON.stringify(newSettings));
  };

  // Sync with Spreadsheet
  const handleSyncWithSpreadsheet = async () => {
    if (!appsScriptConfig.webAppUrl) {
      alert('URL Google Apps Script belum dimasukkan. Silakan buka menu "Script Code.gs" untuk memasukkan URL Web App Anda.');
      setActiveTab('script');
      return;
    }

    setIsSyncing(true);
    try {
      for (const item of entries) {
        await fetch(appsScriptConfig.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
      alert('Sinkronisasi selesai! Semua data berhasil dikirim ke Google Spreadsheet.');
    } catch (e) {
      alert('Gagal menyinkronkan dengan Google Spreadsheet. Pastikan URL Web App valid.');
    } finally {
      setIsSyncing(false);
    }
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen p-3 sm:p-5 md:p-8 font-sans transition-colors duration-200 ${
        isLight
          ? 'bg-slate-100/90 text-slate-900 selection:bg-emerald-200 selection:text-emerald-950'
          : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-amber-400/30 selection:text-amber-200'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Navigation, Logo & Theme Switcher */}
        <Header
          activeTab={activeTab === 'print-report' ? 'reports' : activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          totalEntries={entries.length}
          isAppsScriptConnected={Boolean(appsScriptConfig.webAppUrl)}
          notificationEnabled={notificationSettings.isEnabled}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Dynamic Tab Content with Smooth Fade Transition */}
        <main className="transition-all duration-300 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* TAB 1: FORM INPUT AGENDA KELAS */}
              {activeTab === 'form' && (
                <div className="space-y-6">
                  <AgendaForm
                    onSaveEntry={handleSaveEntry}
                    appsScriptConfig={appsScriptConfig}
                    onOpenScriptGuide={() => setActiveTab('script')}
                    theme={theme}
                  />

                  {/* Quick Summary Cards below form */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
                    <div
                      className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
                        isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                        }`}
                      >
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Catatan Agenda</div>
                        <div className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {entries.length} Sesi Terdata
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
                        isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        }`}
                      >
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Model Pembelajaran</div>
                        <div className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          PJBL, PBL, DL, STEAM
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
                        isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          isLight
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Kurikulum</div>
                        <div className={`text-lg font-bold ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
                          Kurikulum Merdeka SMK
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SPREADSHEET VIEW */}
              {activeTab === 'spreadsheet' && (
                <SpreadsheetView
                  entries={entries}
                  onDeleteEntry={handleDeleteEntry}
                  onClearAll={handleClearAll}
                  onSwitchToPrint={() => setActiveTab('print')}
                  onSwitchToForm={() => setActiveTab('form')}
                  isSyncing={isSyncing}
                  onSyncWithSpreadsheet={handleSyncWithSpreadsheet}
                  onRestoreBackup={handleRestoreBackup}
                  theme={theme}
                />
              )}

              {/* TAB 3: LAPORAN & ANALITIK BEBAN MENGAJAR & ASESMEN */}
              {activeTab === 'reports' && (
                <ReportDashboard
                  entries={entries}
                  onOpenPrintReport={(filter) => {
                    setReportFilterForPrint(filter);
                    setActiveTab('print-report');
                  }}
                  onOpenScriptGuide={() => setActiveTab('script')}
                  theme={theme}
                />
              )}

              {/* TAB 4: NOTIFIKASI & PENGINGAT JADWAL MENGAJAR */}
              {activeTab === 'notifications' && (
                <NotificationManager
                  entries={entries}
                  settings={notificationSettings}
                  onUpdateSettings={handleUpdateNotificationSettings}
                  onOpenScriptGuide={() => setActiveTab('script')}
                  onOpenFormWithEntry={() => setActiveTab('form')}
                  theme={theme}
                />
              )}

              {/* TAB 5: SCRIPT APPS SCRIPT (Code.gs & index.html) */}
              {activeTab === 'script' && (
                <AppsScriptGuideModal
                  config={appsScriptConfig}
                  onSaveConfig={handleSaveConfig}
                  theme={theme}
                />
              )}

              {/* TAB 6: CETAK FORMAT JURNAL RESMI */}
              {activeTab === 'print' && (
                <PrintAgendaDoc
                  entries={entries}
                  onBack={() => setActiveTab('spreadsheet')}
                />
              )}

              {/* TAB 7: CETAK DOKUMEN REKAPITULASI LAPORAN */}
              {activeTab === 'print-report' && (
                <PrintReportDoc
                  entries={entries}
                  initialFilter={reportFilterForPrint}
                  onBack={() => setActiveTab('reports')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* TOAST NOTIFICATION COMPONENT */}
        <AnimatePresence>
          {toast && (
            <motion.div
              id="live-toast-notification"
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] no-print"
            >
              <div
                className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all relative overflow-hidden ${
                  isLight
                    ? 'bg-white/95 text-slate-900 border-emerald-200 shadow-emerald-950/15'
                    : 'bg-slate-900/95 text-white border-emerald-500/40 shadow-2xl shadow-emerald-950/60'
                }`}
              >
                {/* Accent Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold tracking-tight">{toast.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                          toast.entry?.statusKirim === 'Terkirim ke Spreadsheet'
                            ? isLight
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-blue-950/80 text-blue-300 border-blue-600/40'
                            : isLight
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                        }`}
                      >
                        {toast.entry?.statusKirim || 'Tersimpan'}
                      </span>
                    </div>

                    <p className={`text-xs mt-1 truncate ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {toast.message}
                    </p>

                    {toast.entry && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('spreadsheet');
                            setToast(null);
                          }}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                            isLight
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
                          }`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Buka Rekap Jurnal</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                      isLight
                        ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Tutup Notifikasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar line */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4.5, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/80"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KEYBOARD SHORTCUTS CHEATSHEET MODAL */}
        <AnimatePresence>
          {showShortcutModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`max-w-md w-full rounded-2xl p-6 shadow-2xl border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isLight ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Shortcut Keyboard</h3>
                      <p className="text-xs text-slate-500">Navigasi cepat aplikasi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowShortcutModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Tab 1: Input Agenda Kelas</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Ctrl + 1</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Tab 2: Rekap Jurnal Spreadsheet</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Ctrl + 2</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Tab 3: Laporan & Rekap Statistik</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Ctrl + 3</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Tab 4: Notifikasi & Jadwal Mengajar</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Ctrl + 4</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Tab 5: Script Code.gs & Webhook</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Ctrl + 5</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Tab 6: Cetak Format Jurnal Resmi</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Ctrl + 6</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Fokus Pencarian Real-Time</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Ctrl + K / Ctrl + /</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Ganti Tema (Light / Dark Mode)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px]">Alt + T</kbd>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setShowShortcutModal(false)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    Mengerti
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Quick Shortcut & Guide Helper Button */}
        <div className="fixed bottom-4 left-4 z-40 no-print hidden sm:block">
          <button
            type="button"
            onClick={() => setShowShortcutModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border shadow-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight
                ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200 shadow-slate-200/80 hover:text-emerald-700'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-amber-300'
            }`}
            title="Daftar Shortcut Keyboard (Alt + K)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
            <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Alt+K</kbd>
          </button>
        </div>

        {/* Footer */}
        <footer
          className={`mt-12 pt-6 pb-8 border-t text-center text-xs no-print ${
            isLight ? 'border-slate-300 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <img
              src={SMKN_LOGO_URL}
              alt="Logo SMKN Bojonggambir"
              className="w-6 h-6 object-contain"
              referrerPolicy="no-referrer"
            />
            <span
              className={`font-brand font-bold text-sm tracking-wide ${
                isLight ? 'text-emerald-900' : 'text-amber-300'
              }`}
            >
              SMK NEGERI BOJONGGAMBIR
            </span>
            <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>•</span>
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Kabupaten Tasikmalaya</span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Sistem Administrasi Jurnal Pembelajaran Kurikulum Merdeka Terintegrasi Google Apps Script & Spreadsheet
          </p>
        </footer>

      </div>
    </div>
  );
}
