import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Calendar,
  Sparkles,
  BookOpen,
  Send,
  Sliders,
  FileCode
} from 'lucide-react';
import { AgendaEntry, NotificationSettings, ThemeMode } from '../types';
import { DAFTAR_GURU, SMKN_LOGO_URL } from '../constants/agendaData';
import { parseJamKe, playNotificationChime } from '../utils/agendaUtils';

interface NotificationManagerProps {
  entries: AgendaEntry[];
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onOpenScriptGuide: () => void;
  onOpenFormWithEntry?: (entry: Partial<AgendaEntry>) => void;
  theme?: ThemeMode;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  entries,
  settings,
  onUpdateSettings,
  onOpenScriptGuide,
  onOpenFormWithEntry,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Check browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser Anda tidak mendukung Web Notification API.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        onUpdateSettings({ ...settings, browserPush: true });
        new Notification('AGENDA KELAS SMKN Bojonggambir', {
          body: 'Notifikasi jadwal mengajar berhasil diaktifkan!',
          icon: SMKN_LOGO_URL
        });
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
    }
  };

  const handleTestNotification = () => {
    // Play chime sound
    if (settings.playAudio) {
      playNotificationChime();
    }

    // Trigger browser notification
    if (browserPermission === 'granted' && settings.browserPush && 'Notification' in window) {
      new Notification('🔔 Pengingat Mengajar SMKN Bojonggambir', {
        body: `Uji Coba Pengingat: Jam pelajaran berikutnya akan dimulai dalam ${settings.leadTimeMinutes} menit. Siapkan modul ajar dan jurnal kelas!`,
        icon: SMKN_LOGO_URL
      });
    }

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  // Filter lessons for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLessons = entries.filter((entry) => {
    const entryDate = entry.tanggal || (entry.timestamp ? entry.timestamp.split('T')[0] : '');
    const matchDate = entryDate === todayStr;
    const matchGuru = settings.selectedGuru === 'Semua' || entry.namaGuru === settings.selectedGuru;
    return matchDate && matchGuru;
  });

  const cardStyle = isLight
    ? 'bg-white border border-slate-200 shadow-sm rounded-2xl p-5 md:p-6 transition-all'
    : 'bg-slate-900/90 border border-slate-800 shadow-xl rounded-2xl p-5 md:p-6 transition-all';

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div
        className={`rounded-2xl p-5 md:p-6 transition-all relative overflow-hidden ${
          isLight
            ? 'bg-white border border-slate-200 shadow-lg shadow-slate-200/50'
            : 'bg-slate-900/90 border border-slate-800 shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-sm border ${
                isLight ? 'bg-white border-slate-200' : 'bg-white/95 border-slate-200/40'
              }`}
            >
              <img
                src={SMKN_LOGO_URL}
                alt="Logo SMKN Bojonggambir"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  Smart Reminder
                </span>
                <span className={`text-xs font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-300'}`}>
                  Waktu Sistem: {currentTime || '--:--:--'} WIB
                </span>
              </div>
              <h2
                className={`text-xl md:text-2xl font-bold font-brand mt-1 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Pengingat & Notifikasi Jadwal Mengajar
              </h2>
              <p className={`text-xs md:text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Otomatisasi pengingat jam pelajaran bagi guru SMKN Bojonggambir sebelum waktu mengajar dimulai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleTestNotification}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Play className="w-4 h-4" />
              <span>Tes Suara & Notifikasi</span>
            </button>
          </div>
        </div>

        {testNotificationSent && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Notifikasi uji coba dan suara lonceng sekolah berhasil dibunyikan!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2 Cols): Notification Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className={cardStyle}>
            
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Pengaturan Notifikasi Guru
                </h3>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className={`ml-3 text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {settings.isEnabled ? 'Notifikasi Aktif' : 'Notifikasi Nonaktif'}
                </span>
              </label>
            </div>

            {/* Teacher Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Filter Jadwal untuk Guru:
                </label>
                <select
                  value={settings.selectedGuru}
                  onChange={(e) => onUpdateSettings({ ...settings, selectedGuru: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs md:text-sm outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                  }`}
                >
                  <option value="Semua">Semua Guru (19 Guru SMKN Bojonggambir)</option>
                  {DAFTAR_GURU.map((guru) => (
                    <option key={guru} value={guru}>
                      Bpk/Ibu Guru {guru}
                    </option>
                  ))}
                </select>
                <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Pilih nama Anda agar notifikasi hanya berbunyi saat jadwal mengajar Anda.
                </p>
              </div>

              {/* Lead Time */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Waktu Pengingat Sebelum Jam Mengajar:
                </label>
                <select
                  value={settings.leadTimeMinutes}
                  onChange={(e) => onUpdateSettings({ ...settings, leadTimeMinutes: Number(e.target.value) })}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs md:text-sm outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                  }`}
                >
                  <option value={5}>5 Menit Sebelum Kelas Dimulai</option>
                  <option value={10}>10 Menit Sebelum Kelas Dimulai</option>
                  <option value={15}>15 Menit Sebelum Kelas Dimulai (Direkomendasikan)</option>
                  <option value={30}>30 Menit Sebelum Kelas Dimulai</option>
                </select>
                <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Waktu jeda persiapan sebelum memasuki kelas pembelajaran.
                </p>
              </div>
            </div>

            {/* Toggle Channels: Sound, Browser, Daily Email/Summary */}
            <div className="space-y-3 pt-4">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Kanal & Media Notifikasi
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Audio Bell Chime */}
                <div
                  onClick={() => onUpdateSettings({ ...settings, playAudio: !settings.playAudio })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    settings.playAudio
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                        : 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        settings.playAudio
                          ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                          : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {settings.playAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Suara Bel Kelas Harmonis
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Chime synthesizer Web Audio API
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      settings.playAudio
                        ? 'bg-emerald-600 border-emerald-500'
                        : isLight ? 'border-slate-300' : 'border-slate-600'
                    }`}
                  >
                    {settings.playAudio && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                </div>

                {/* Browser Desktop Push */}
                <div
                  onClick={
                    browserPermission === 'granted'
                      ? () => onUpdateSettings({ ...settings, browserPush: !settings.browserPush })
                      : requestBrowserPermission
                  }
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    settings.browserPush && browserPermission === 'granted'
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                        : 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        settings.browserPush && browserPermission === 'granted'
                          ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                          : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Notifikasi Browser Desktop
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {browserPermission === 'granted' ? 'Izin Browser Diberikan' : 'Klik untuk Izinkan Browser'}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      settings.browserPush && browserPermission === 'granted'
                        ? 'bg-emerald-600 border-emerald-500'
                        : isLight ? 'border-slate-300' : 'border-slate-600'
                    }`}
                  >
                    {settings.browserPush && browserPermission === 'granted' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>

              </div>

              {/* Email / Webhook Notification Toggle */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Pengingat Otomatis via Google Apps Script (Email Digest)
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Kirim jadwal harian otomatis ke email guru sebelum pukul 07.00 WIB
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailDailyDigest}
                    onChange={(e) => onUpdateSettings({ ...settings, emailDailyDigest: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN (1 Col): Today's Schedule & Alarm Status */}
        <div className="space-y-4">
          <div className={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Jadwal & Alarm Hari Ini
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                {todayLessons.length} Sesi
              </span>
            </div>

            {todayLessons.length === 0 ? (
              <div className={`text-center py-8 space-y-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                    isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs">Belum ada agenda kelas terdaftar untuk tanggal hari ini ({todayStr}).</p>
                <p className="text-[11px]">
                  Masukkan data agenda di menu <strong>Input Agenda Kelas</strong> untuk mengaktifkan jadwal alarm.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {todayLessons.map((item) => {
                  const slot = parseJamKe(item.jamKe);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                          : 'bg-slate-950/80 border-slate-800 hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
                          {item.kelas}
                        </span>
                        <span
                          className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            isLight
                              ? 'bg-white text-slate-800 border-slate-300'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                          }`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <div className={`text-xs font-medium truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.mataPelajaran}
                      </div>
                      <div
                        className={`flex items-center justify-between text-[11px] pt-1 border-t ${
                          isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'
                        }`}
                      >
                        <span>Guru: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{item.namaGuru}</strong></span>
                        <span className="font-semibold text-emerald-700 dark:text-amber-400">{item.modelMetode}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={`pt-3 border-t mt-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <button
                onClick={onOpenScriptGuide}
                className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lihat Panduan Script Notifikasi (Code.gs)</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
