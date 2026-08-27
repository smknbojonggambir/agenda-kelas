import React, { useState, useMemo, useRef } from 'react';
import {
  Table,
  Search,
  Download,
  Trash2,
  Eye,
  Calendar,
  User,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  X,
  Printer,
  FileJson,
  Upload,
  CheckCircle2,
  AlertCircle,
  HardDriveDownload,
  HardDriveUpload,
  HelpCircle,
  Filter
} from 'lucide-react';
import { AgendaEntry, BackupPayload, ThemeMode } from '../types';
import { DAFTAR_GURU, DAFTAR_KELAS, SMKN_LOGO_URL } from '../constants/agendaData';

interface SpreadsheetViewProps {
  entries: AgendaEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onSwitchToPrint: () => void;
  onSwitchToForm: () => void;
  isSyncing: boolean;
  onSyncWithSpreadsheet: () => void;
  onRestoreBackup?: (restoredEntries: AgendaEntry[], mode: 'merge' | 'replace') => void;
  theme?: ThemeMode;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  entries,
  onDeleteEntry,
  onClearAll,
  onSwitchToPrint,
  onSwitchToForm,
  isSyncing,
  onSyncWithSpreadsheet,
  onRestoreBackup,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGuru, setFilterGuru] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restorePayload, setRestorePayload] = useState<BackupPayload | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered entries with real-time multi-field search
  const filteredEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return entries.filter((item) => {
      const matchSearch =
        q === '' ||
        item.namaGuru.toLowerCase().includes(q) ||
        item.mataPelajaran.toLowerCase().includes(q) ||
        item.tujuan.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q) ||
        item.jurusan.toLowerCase().includes(q) ||
        item.modelMetode.toLowerCase().includes(q) ||
        item.hari.toLowerCase().includes(q) ||
        item.tanggal.includes(q) ||
        item.jamKe.toLowerCase().includes(q) ||
        (item.catatanKejadian && item.catatanKejadian.toLowerCase().includes(q));

      const matchGuru = filterGuru === '' || item.namaGuru === filterGuru;
      const matchKelas = filterKelas === '' || item.kelas === filterKelas;
      const matchJurusan = filterJurusan === '' || item.jurusan === filterJurusan;

      return matchSearch && matchGuru && matchKelas && matchJurusan;
    });
  }, [entries, searchTerm, filterGuru, filterKelas, filterJurusan]);

  // Export to CSV (Excel-Compatible UTF-8 with BOM)
  const handleExportCSV = (exportOnlyFiltered: boolean = false) => {
    const dataToExport = exportOnlyFiltered ? filteredEntries : entries;
    if (dataToExport.length === 0) return;

    const headers = [
      'No',
      'ID Agenda',
      'Waktu Dicatat',
      'Hari',
      'Tanggal (YYYY-MM-DD)',
      'Jam Ke / Sesi',
      'Nama Guru',
      'Jurusan',
      'Kelas',
      'Mata Pelajaran',
      'Tujuan Pembelajaran (TP)',
      'Model / Metode',
      'Asesmen Formatif',
      'Asesmen Sumatif',
      'Jumlah Hadir',
      'Jumlah Sakit',
      'Jumlah Izin',
      'Jumlah Alfa',
      'Total Siswa',
      'Catatan Kejadian / Refleksi'
    ];

    const rows = dataToExport.map((item, idx) => {
      const h = item.kehadiran?.hadir ?? 0;
      const s = item.kehadiran?.sakit ?? 0;
      const i = item.kehadiran?.izin ?? 0;
      const a = item.kehadiran?.alfa ?? 0;
      const tot = h + s + i + a;

      return [
        idx + 1,
        `"${item.id}"`,
        `"${new Date(item.timestamp).toLocaleString('id-ID')}"`,
        `"${item.hari}"`,
        `"${item.tanggal}"`,
        `"${item.jamKe}"`,
        `"${item.namaGuru.replace(/"/g, '""')}"`,
        `"${item.jurusan}"`,
        `"${item.kelas}"`,
        `"${item.mataPelajaran.replace(/"/g, '""')}"`,
        `"${item.tujuan.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${item.modelMetode}"`,
        `"${(item.asesmenFormatif || []).join(', ')}"`,
        `"${(item.asesmenSumatif || []).join(', ')}"`,
        h,
        s,
        i,
        a,
        tot,
        `"${(item.catatanKejadian || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
    });

    // Use BOM \uFEFF so MS Excel automatically recognizes UTF-8 (Indonesian letters & accents)
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute(
      'download',
      `AGENDA_KELAS_SMKN_BOJONGGAMBIR_${exportOnlyFiltered ? 'FILTERED_' : ''}${dateStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Complete Backup JSON
  const handleExportJSON = () => {
    if (entries.length === 0) return;

    const payload: BackupPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'AGENDA KELAS SMKN Bojonggambir',
      schoolName: 'SMK Negeri Bojonggambir',
      totalEntries: entries.length,
      entries: entries
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute(
      'download',
      `BACKUP_AGENDA_SMKN_BOJONGGAMBIR_${dateStr}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle JSON File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        // Verify valid structure
        let entriesList: AgendaEntry[] = [];
        if (Array.isArray(parsed)) {
          entriesList = parsed;
        } else if (parsed && Array.isArray(parsed.entries)) {
          entriesList = parsed.entries;
        } else {
          throw new Error('Format file JSON tidak dikenali sebagai backup Agenda Kelas.');
        }

        if (entriesList.length === 0) {
          throw new Error('File backup JSON tidak memuat catatan agenda.');
        }

        setRestorePayload({
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          appName: parsed.appName || 'AGENDA KELAS SMKN Bojonggambir',
          schoolName: parsed.schoolName || 'SMK Negeri Bojonggambir',
          totalEntries: entriesList.length,
          entries: entriesList
        });
      } catch (err: any) {
        setRestoreError(err.message || 'Gagal membaca file JSON. Pastikan file valid.');
        setRestorePayload(null);
      }
    };
    reader.onerror = () => {
      setRestoreError('Gagal membuka file.');
    };
    reader.readAsText(file);
  };

  // Execute Restore (Merge or Replace)
  const handleExecuteRestore = (mode: 'merge' | 'replace') => {
    if (!restorePayload || !onRestoreBackup) return;

    onRestoreBackup(restorePayload.entries, mode);
    setRestoreSuccessMsg(
      `Berhasil memulihkan ${restorePayload.entries.length} data agenda (${mode === 'merge' ? 'Digabungkan' : 'Mengganti semua data'})!`
    );
    setTimeout(() => {
      setIsRestoreModalOpen(false);
      setRestorePayload(null);
      setRestoreSuccessMsg(null);
    }, 1200);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Controls Bar */}
      <div
        className={`rounded-2xl p-5 md:p-6 transition-all ${
          isLight
            ? 'bg-white border border-slate-200 shadow-lg shadow-slate-200/50'
            : 'bg-slate-900/90 border border-slate-800 shadow-xl'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-sm border ${
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
              <h2
                className={`text-xl md:text-2xl font-bold font-brand tracking-wide flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <span>Data Rekap Spreadsheet Agenda Kelas</span>
              </h2>
              <p className={`text-xs md:text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Menampilkan {filteredEntries.length} dari total {entries.length} catatan agenda pembelajaran.
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Button */}
            <button
              onClick={onSyncWithSpreadsheet}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                  : 'bg-emerald-950 text-emerald-100 hover:bg-emerald-900 border-emerald-700/50'
              }`}
              title="Sinkronkan dengan Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              id="btn-export-csv"
              onClick={() => handleExportCSV(false)}
              disabled={entries.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Ekspor Data ke Format CSV Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV (Excel)</span>
            </button>

            {/* Backup JSON Button */}
            <button
              id="btn-backup-json"
              onClick={handleExportJSON}
              disabled={entries.length === 0}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
              title="Unduh Backup File JSON ke Komputer"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-amber-500" />
              <span>Backup JSON</span>
            </button>

            {/* Restore JSON Button */}
            <button
              id="btn-restore-json"
              onClick={() => {
                setRestorePayload(null);
                setRestoreError(null);
                setRestoreSuccessMsg(null);
                setIsRestoreModalOpen(true);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
              }`}
              title="Pulihkan Data dari File Backup JSON"
            >
              <HardDriveUpload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pulihkan JSON</span>
            </button>

            {/* Print View */}
            <button
              onClick={onSwitchToPrint}
              disabled={entries.length === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>Format Cetak Jurnal</span>
            </button>

            {/* Reset / Clear All */}
            {entries.length > 0 && (
              <button
                onClick={onClearAll}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-500/40'
                }`}
                title="Hapus Semua Data Agenda Lokal"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

        {/* Filter & Search Bar */}
        <div
          className={`mt-5 pt-4 border-t space-y-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Real-Time Search Input with Clear Button */}
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                id="spreadsheet-search-input"
                type="text"
                placeholder="Cari guru, mapel, materi, kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-xl pl-9 pr-8 py-2.5 text-xs outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400'
                    : 'bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-500'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-2.5 top-3 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
                    isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Hapus kata kunci pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Guru */}
            <div>
              <select
                id="filter-guru-select"
                value={filterGuru}
                onChange={(e) => setFilterGuru(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 text-xs outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    : 'bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                }`}
              >
                <option value="">Semua Guru ({DAFTAR_GURU.length})</option>
                {DAFTAR_GURU.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Jurusan */}
            <div>
              <select
                id="filter-jurusan-select"
                value={filterJurusan}
                onChange={(e) => setFilterJurusan(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 text-xs outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    : 'bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                }`}
              >
                <option value="">Semua Jurusan (DKV & APHP)</option>
                <option value="DKV">DKV (Desain Komunikasi Visual)</option>
                <option value="APHP">APHP (Agribisnis Pengolahan Hasil Pertanian)</option>
              </select>
            </div>

            {/* Filter Kelas */}
            <div>
              <select
                id="filter-kelas-select"
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 text-xs outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    : 'bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                }`}
              >
                <option value="">Semua Kelas ({DAFTAR_KELAS.length} Rombel)</option>
                {DAFTAR_KELAS.map((k) => (
                  <option key={k.nama} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Search Chips & Status Indicator */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] font-semibold flex items-center gap-1 mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <Filter className="w-3 h-3" /> Filter Cepat:
              </span>
              <button
                type="button"
                onClick={() => setSearchTerm('DKV')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  searchTerm === 'DKV'
                    ? isLight ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-emerald-700 text-white border-emerald-500'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                DKV
              </button>
              <button
                type="button"
                onClick={() => setSearchTerm('APHP')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  searchTerm === 'APHP'
                    ? isLight ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-emerald-700 text-white border-emerald-500'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                APHP
              </button>
              <button
                type="button"
                onClick={() => setSearchTerm('PJBL')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  searchTerm === 'PJBL'
                    ? isLight ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-emerald-700 text-white border-emerald-500'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                PJBL
              </button>
              <button
                type="button"
                onClick={() => setSearchTerm('PBL')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  searchTerm === 'PBL'
                    ? isLight ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-emerald-700 text-white border-emerald-500'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                PBL
              </button>
              {(searchTerm || filterGuru || filterJurusan || filterKelas) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterGuru('');
                    setFilterJurusan('');
                    setFilterKelas('');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-rose-950/60 text-rose-300 border-rose-700/50 hover:bg-rose-900'
                  }`}
                >
                  <X className="w-3 h-3" /> Bersihkan Semua Filter
                </button>
              )}
            </div>

            {/* Real-time Counter Badge */}
            <div className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Ditemukan <strong className={isLight ? 'text-emerald-700' : 'text-amber-300'}>{filteredEntries.length}</strong> entri agenda
              {entries.length > 0 && ` (dari total ${entries.length})`}
            </div>
          </div>

        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div
        className={`rounded-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border border-slate-200 shadow-md'
            : 'bg-slate-900/90 border border-slate-800 shadow-xl'
        }`}
      >
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Belum Ada Data Agenda Kelas
            </h3>
            <p className={`text-xs max-w-md mx-auto mt-1 mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {entries.length === 0
                ? 'Silakan isi formulir agenda harian terlebih dahulu untuk melihat rekap data spreadsheet di sini.'
                : 'Tidak ada data yang cocok dengan kriteria pencarian / filter di atas.'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={onSwitchToForm}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                + Buat Agenda Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-extrabold uppercase tracking-wider ${
                    isLight
                      ? 'bg-emerald-800 text-white border-emerald-900'
                      : 'bg-slate-950 text-emerald-300 border-slate-800'
                  }`}
                >
                  <th className="p-3.5 text-center w-10">No</th>
                  <th className="p-3.5 whitespace-nowrap">Hari & Tanggal</th>
                  <th className="p-3.5 whitespace-nowrap">Jam Ke</th>
                  <th className="p-3.5 whitespace-nowrap">Nama Guru</th>
                  <th className="p-3.5 whitespace-nowrap">Jurusan & Kelas</th>
                  <th className="p-3.5">Mata Pelajaran</th>
                  <th className="p-3.5 min-w-[220px]">Tujuan Pembelajaran</th>
                  <th className="p-3.5 whitespace-nowrap">Metode</th>
                  <th className="p-3.5 whitespace-nowrap">Asesmen</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Presensi</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-slate-800 text-slate-200'
                }`}
              >
                {filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isLight
                        ? 'hover:bg-emerald-50/70'
                        : 'hover:bg-slate-800/80'
                    }`}
                  >
                    <td
                      className={`p-3.5 text-center font-mono font-bold ${
                        isLight ? 'text-emerald-800' : 'text-amber-300/90'
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {entry.hari}
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {entry.tanggal}
                      </div>
                    </td>
                    <td
                      className={`p-3.5 whitespace-nowrap font-medium ${
                        isLight ? 'text-emerald-800' : 'text-emerald-300'
                      }`}
                    >
                      {entry.jamKe}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div
                        className={`font-bold flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900' : 'text-amber-200'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{entry.namaGuru}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          isLight
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {entry.kelas}
                      </span>
                      <span className={`ml-1 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        ({entry.jurusan})
                      </span>
                    </td>
                    <td className={`p-3.5 font-medium max-w-[180px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {entry.mataPelajaran}
                    </td>
                    <td className={`p-3.5 max-w-[240px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <p className="line-clamp-2 leading-relaxed">{entry.tujuan}</p>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-emerald-950 text-emerald-200 border-emerald-700'
                        }`}
                      >
                        {entry.modelMetode}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-[11px]">
                      {entry.asesmenFormatif && entry.asesmenFormatif.length > 0 && (
                        <div className={`truncate max-w-[140px] ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                          F: {entry.asesmenFormatif.join(', ')}
                        </div>
                      )}
                      {entry.asesmenSumatif && entry.asesmenSumatif.length > 0 && (
                        <div className={`truncate max-w-[140px] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          S: {entry.asesmenSumatif.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap font-mono text-[11px]">
                      <span className="text-emerald-600 font-bold" title="Hadir">H:{entry.kehadiran?.hadir ?? '-'}</span>{' '}
                      <span className="text-amber-600 font-medium" title="Sakit">S:{entry.kehadiran?.sakit ?? 0}</span>{' '}
                      <span className="text-blue-600 font-medium" title="Izin">I:{entry.kehadiran?.izin ?? 0}</span>{' '}
                      <span className="text-rose-600 font-medium" title="Alfa">A:{entry.kehadiran?.alfa ?? 0}</span>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(entry)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                          }`}
                          title="Lihat Detail Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isLight
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-rose-950/60 hover:bg-rose-900 text-rose-200 border-rose-800'
                          }`}
                          title="Hapus Catatan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Restore Backup JSON */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 relative border shadow-2xl ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <button
              onClick={() => setIsRestoreModalOpen(false)}
              className={`absolute right-4 top-4 p-1.5 rounded-lg transition-all cursor-pointer ${
                isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                <HardDriveUpload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Pulihkan Data Agenda (JSON Backup)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unggah file cadangan JSON untuk mengembalikan data catatan mengajar.
                </p>
              </div>
            </div>

            {/* Error & Success Feedback */}
            {restoreError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}
            {restoreSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{restoreSuccessMsg}</span>
              </div>
            )}

            {/* File Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isLight
                  ? 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40'
                  : 'border-slate-700 hover:border-indigo-400 bg-slate-950 hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileJson className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Klik untuk memilih file backup JSON
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                (Format: BACKUP_AGENDA_SMKN_BOJONGGAMBIR_*.json)
              </p>
            </div>

            {/* Payload Preview */}
            {restorePayload && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>File Backup Terverifikasi:</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  • Total Entri: <b>{restorePayload.entries.length} catatan agenda</b>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  • Tanggal Backup: {new Date(restorePayload.exportedAt).toLocaleString('id-ID')}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  • Asal Sekolah: {restorePayload.schoolName}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleExecuteRestore('merge')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Gabungkan (Merge)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteRestore('replace')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Ganti Semua (Replace)
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Entry */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar border shadow-2xl ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <button
              onClick={() => setSelectedEntry(null)}
              className={`absolute right-4 top-4 p-1.5 rounded-lg transition-all cursor-pointer ${
                isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isLight
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}
              >
                {selectedEntry.kelas} ({selectedEntry.jurusan})
              </span>
              <h3 className="text-lg font-bold">Detail Agenda Pembelajaran</h3>
            </div>

            <div className="space-y-4 text-xs md:text-sm">
              <div
                className={`grid grid-cols-2 gap-3 p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-slate-500 text-[11px]">Hari & Tanggal</div>
                  <div className="font-bold">{selectedEntry.hari}, {selectedEntry.tanggal}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Jam Pelajaran</div>
                  <div className="font-bold text-emerald-600 dark:text-amber-300">{selectedEntry.jamKe}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Nama Guru Pengampu</div>
                  <div className="font-bold">{selectedEntry.namaGuru}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Model / Metode</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{selectedEntry.modelMetode}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-[11px] font-semibold mb-1">Mata Pelajaran:</div>
                <div
                  className={`p-2.5 rounded-xl font-semibold border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {selectedEntry.mataPelajaran}
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-[11px] font-semibold mb-1">Tujuan Pembelajaran (TP) & Materi:</div>
                <div
                  className={`p-3 rounded-xl border whitespace-pre-wrap leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  {selectedEntry.tujuan}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="text-amber-700 dark:text-amber-300 font-bold text-xs mb-1">Asesmen Formatif:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {selectedEntry.asesmenFormatif && selectedEntry.asesmenFormatif.length > 0
                      ? selectedEntry.asesmenFormatif.join(', ')
                      : 'Tidak ada'}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="text-emerald-700 dark:text-emerald-300 font-bold text-xs mb-1">Asesmen Sumatif:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {selectedEntry.asesmenSumatif && selectedEntry.asesmenSumatif.length > 0
                      ? selectedEntry.asesmenSumatif.join(', ')
                      : 'Tidak ada'}
                  </div>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="text-slate-500 text-[11px] font-semibold mb-1">Presensi Siswa:</div>
                <div className="flex gap-4 font-mono font-bold text-xs">
                  <span className="text-emerald-600">Hadir: {selectedEntry.kehadiran?.hadir ?? 0}</span>
                  <span className="text-amber-600">Sakit: {selectedEntry.kehadiran?.sakit ?? 0}</span>
                  <span className="text-blue-600">Izin: {selectedEntry.kehadiran?.izin ?? 0}</span>
                  <span className="text-rose-600">Alfa: {selectedEntry.kehadiran?.alfa ?? 0}</span>
                </div>
              </div>

              {selectedEntry.catatanKejadian && (
                <div>
                  <div className="text-slate-500 text-[11px] font-semibold mb-1">Catatan Refleksi / Kejadian:</div>
                  <div
                    className={`p-3 rounded-xl border text-xs italic ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    "{selectedEntry.catatanKejadian}"
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
