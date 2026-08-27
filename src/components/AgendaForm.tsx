import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  GraduationCap,
  BookOpen,
  Target,
  Layers,
  CheckSquare,
  Users,
  Send,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Info,
  Check
} from 'lucide-react';
import { AgendaEntry, AppsScriptConfig, ThemeMode } from '../types';
import {
  DAFTAR_GURU,
  DAFTAR_JURUSAN,
  DAFTAR_KELAS,
  DAFTAR_MAPEL,
  DAFTAR_JAM_KE,
  DAFTAR_MODEL_METODE,
  OPSI_ASESMEN_FORMATIF,
  OPSI_ASESMEN_SUMATIF,
  CONTOH_TEMPLATE_TUJUAN
} from '../constants/agendaData';
import { parseJamKe } from '../utils/agendaUtils';

interface AgendaFormProps {
  onSaveEntry: (entry: AgendaEntry) => Promise<boolean>;
  appsScriptConfig: AppsScriptConfig;
  onOpenScriptGuide: () => void;
  theme?: ThemeMode;
}

export const AgendaForm: React.FC<AgendaFormProps> = ({
  onSaveEntry,
  appsScriptConfig,
  onOpenScriptGuide,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  // 1. Hari dan Tanggal
  const [hari, setHari] = useState<string>('Senin');
  const [tanggal, setTanggal] = useState<string>('');

  // 2. Jam ke
  const [jamKe, setJamKe] = useState<string>('Jam 1 s/d 3 (07.00 - 09.15 WIB)');

  // 3. Nama Guru
  const [namaGuru, setNamaGuru] = useState<string>('');

  // 4. Jurusan & Kelas
  const [jurusan, setJurusan] = useState<string>('DKV');
  const [kelas, setKelas] = useState<string>('X DKV 1');

  // 5. Mata Pelajaran
  const [mataPelajaran, setMataPelajaran] = useState<string>('Dasar-dasar Kejuruan DKV');
  const [filterKategoriMapel, setFilterKategoriMapel] = useState<string>('Semua');

  // 6. Tujuan Pembelajaran
  const [tujuan, setTujuan] = useState<string>('');

  // 7. Model atau Metode
  const [modelMetode, setModelMetode] = useState<string>('PJBL');

  // 8. Asesmen Formatif & Sumatif
  const [selectedFormatif, setSelectedFormatif] = useState<string[]>(['Tanya', 'Jawab', 'Quiz']);
  const [selectedSumatif, setSelectedSumatif] = useState<string[]>(['Projek']);

  // Kehadiran Siswa & Refleksi
  const [kehadiran, setKehadiran] = useState({
    hadir: 34,
    sakit: 1,
    izin: 0,
    alfa: 0
  });
  const [catatanKejadian, setCatatanKejadian] = useState<string>('');

  // Validation Errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Auto-detect Hari dari Tanggal saat komponen dimuat
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setTanggal(formattedDate);
    updateHariFromDate(today);
  }, []);

  const updateHariFromDate = (dateObj: Date) => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const detectedDay = dayNames[dateObj.getDay()];
    setHari(detectedDay);
  };

  const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTanggal(val);
    if (val) {
      const parts = val.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (!isNaN(d.getTime())) {
        updateHariFromDate(d);
      }
    }
    // Clear error on change
    if (fieldErrors.tanggal) {
      setFieldErrors(prev => ({ ...prev, tanggal: '' }));
    }
  };

  // Jam slot details calculation
  const parsedJam = useMemo(() => {
    return parseJamKe(jamKe);
  }, [jamKe]);

  // Total Siswa & Persentase Kehadiran
  const totalSiswa = useMemo(() => {
    const h = Number(kehadiran.hadir) || 0;
    const s = Number(kehadiran.sakit) || 0;
    const i = Number(kehadiran.izin) || 0;
    const a = Number(kehadiran.alfa) || 0;
    return h + s + i + a;
  }, [kehadiran]);

  const persentaseHadir = useMemo(() => {
    if (totalSiswa === 0) return 0;
    return Math.round(((Number(kehadiran.hadir) || 0) / totalSiswa) * 100);
  }, [kehadiran.hadir, totalSiswa]);

  // Saat Jurusan berubah, sesuaikan pilihan kelas & mapel default
  const handleJurusanChange = (newJurusan: string) => {
    setJurusan(newJurusan);
    const kelasTersedia = DAFTAR_KELAS.filter(k => k.jurusan === newJurusan);
    if (kelasTersedia.length > 0) {
      setKelas(kelasTersedia[0].nama);
    }
    if (newJurusan === 'DKV') {
      setMataPelajaran('Dasar-dasar Kejuruan DKV');
    } else if (newJurusan === 'APHP') {
      setMataPelajaran('Dasar-dasar Kejuruan APHP');
    }
  };

  // Toggle Checkbox Asesmen Formatif
  const toggleFormatif = (item: string) => {
    setSelectedFormatif(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Toggle Checkbox Asesmen Sumatif
  const toggleSumatif = (item: string) => {
    setSelectedSumatif(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Handle Template Tujuan Cepat
  const handleApplyTemplateTujuan = (template: string) => {
    setTujuan(prev => (prev ? `${prev}\n${template}` : template));
    if (fieldErrors.tujuan) {
      setFieldErrors(prev => ({ ...prev, tujuan: '' }));
    }
  };

  // Reset Form
  const handleResetForm = () => {
    const today = new Date();
    setTanggal(today.toISOString().split('T')[0]);
    updateHariFromDate(today);
    setJamKe('Jam 1 s/d 3 (07.00 - 09.15 WIB)');
    setNamaGuru('');
    setJurusan('DKV');
    setKelas('X DKV 1');
    setMataPelajaran('Dasar-dasar Kejuruan DKV');
    setTujuan('');
    setModelMetode('PJBL');
    setSelectedFormatif(['Tanya', 'Jawab', 'Quiz']);
    setSelectedSumatif(['Projek']);
    setKehadiran({ hadir: 34, sakit: 1, izin: 0, alfa: 0 });
    setCatatanKejadian('');
    setFieldErrors({});
    setSubmitStatus({ type: null, message: '' });
  };

  // Validate form thoroughly
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // 1. Tanggal validation
    if (!tanggal) {
      errors.tanggal = 'Tanggal pembelajaran wajib diisi.';
    } else {
      const year = parseInt(tanggal.split('-')[0], 10);
      if (isNaN(year) || year < 2024 || year > 2030) {
        errors.tanggal = 'Tahun tanggal tidak valid (rentang tahun 2024 - 2030).';
      }
    }

    // 2. Jam Ke validation
    if (!jamKe) {
      errors.jamKe = 'Jam pembelajaran wajib dipilih.';
    }

    // 3. Nama Guru validation
    if (!namaGuru) {
      errors.namaGuru = 'Nama Guru pengampu wajib dipilih dari daftar.';
    }

    // 4. Kelas & Mapel validation
    if (!kelas) {
      errors.kelas = 'Kelas wajib dipilih.';
    }
    if (!mataPelajaran) {
      errors.mataPelajaran = 'Mata pelajaran wajib dipilih.';
    }

    // 5. Tujuan Pembelajaran validation
    if (!tujuan.trim()) {
      errors.tujuan = 'Tujuan Pembelajaran (TP) / uraian materi wajib diisi.';
    } else if (tujuan.trim().length < 10) {
      errors.tujuan = 'Tujuan Pembelajaran terlalu singkat (minimal 10 karakter).';
    }

    // 6. Kehadiran validation
    const h = Number(kehadiran.hadir) || 0;
    const s = Number(kehadiran.sakit) || 0;
    const i = Number(kehadiran.izin) || 0;
    const a = Number(kehadiran.alfa) || 0;

    if (h < 0 || s < 0 || i < 0 || a < 0) {
      errors.kehadiran = 'Jumlah siswa tidak boleh bernilai negatif.';
    } else if (h + s + i + a === 0) {
      errors.kehadiran = 'Total siswa presensi tidak boleh 0.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus({
        type: 'error',
        message: 'Mohon periksa kembali formulir. Terdapat isian yang belum lengkap atau tidak valid.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    const newEntry: AgendaEntry = {
      id: 'AGENDA-' + Date.now(),
      timestamp: new Date().toISOString(),
      hari,
      tanggal,
      jamKe,
      namaGuru,
      jurusan,
      kelas,
      mataPelajaran,
      tujuan: tujuan.trim(),
      modelMetode,
      asesmenFormatif: selectedFormatif,
      asesmenSumatif: selectedSumatif,
      kehadiran: {
        hadir: Number(kehadiran.hadir) || 0,
        sakit: Number(kehadiran.sakit) || 0,
        izin: Number(kehadiran.izin) || 0,
        alfa: Number(kehadiran.alfa) || 0
      },
      catatanKejadian: catatanKejadian.trim() || 'Pembelajaran berlangsung kondusif dan aktif.'
    };

    try {
      const success = await onSaveEntry(newEntry);
      if (success) {
        setSubmitStatus({
          type: 'success',
          message: `Agenda Kelas berhasil dicatat untuk ${kelas} - ${mataPelajaran} (${namaGuru})!`
        });
        // Kosongkan tujuan & catatan untuk input selanjutnya
        setTujuan('');
        setCatatanKejadian('');
        setFieldErrors({});
      } else {
        setSubmitStatus({
          type: 'error',
          message: 'Gagal mencatat agenda. Silakan coba kembali.'
        });
      }
    } catch (err: any) {
      setSubmitStatus({
        type: 'error',
        message: 'Terjadi kesalahan: ' + (err.message || err.toString())
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Base card class helper
  const cardStyle = isLight
    ? 'bg-white border border-slate-200/90 shadow-sm rounded-xl p-4 md:p-5 transition-all'
    : 'bg-slate-900/80 border border-slate-800 shadow-md rounded-xl p-4 md:p-5 transition-all';

  const inputStyle = isLight
    ? 'w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400'
    : 'w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-500';

  const labelStyle = isLight
    ? 'text-sm md:text-base font-bold text-slate-800 flex items-center gap-2'
    : 'text-sm md:text-base font-bold text-slate-100 flex items-center gap-2';

  const numBadgeStyle = isLight
    ? 'w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-300 shrink-0'
    : 'w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-400/40 shrink-0';

  return (
    <div className="w-full">
      <div
        className={`rounded-2xl p-5 md:p-8 transition-all relative ${
          isLight
            ? 'bg-white border border-slate-200 shadow-xl shadow-slate-200/40'
            : 'bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md'
        }`}
      >
        {/* Banner Title & Description */}
        <div
          className={`mb-6 pb-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-amber-400'}`} />
              <span>Formulir Jurnal Mengajar Terintegrasi</span>
            </div>
            <h2
              className={`text-xl md:text-2xl font-bold tracking-wide font-brand flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <span>Pengisian Agenda Kelas Harian</span>
            </h2>
            <p
              className={`text-xs md:text-sm mt-0.5 ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Lengkapi 8 item menu administrasi Kurikulum Merdeka SMKN Bojonggambir di bawah ini.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenScriptGuide}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300 shadow-sm'
                  : 'bg-emerald-950 text-amber-200 hover:bg-emerald-900 border-amber-400/40'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hubungkan Spreadsheet</span>
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
              }`}
              title="Reset Formulir"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {submitStatus.type && (
          <div
            id="form-feedback-alert"
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
              submitStatus.type === 'success'
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                  : 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
                : isLight
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                : 'bg-rose-950/90 border-rose-500 text-rose-100'
            }`}
          >
            {submitStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-medium">
              {submitStatus.message}
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ========================================================
              MENU 1: HARI & TANGGAL (Kalender)
             ======================================================== */}
          <div className={`${cardStyle} ${fieldErrors.tanggal ? 'border-rose-500' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={numBadgeStyle}>1</span>
                <label className={labelStyle}>
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hari dan Tanggal (Kalender)</span>
                </label>
              </div>
              {hari === 'Minggu' && (
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Hari Minggu (KBM Libur)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Hari Pembelajaran
                </label>
                <select
                  id="select-hari"
                  value={hari}
                  onChange={(e) => setHari(e.target.value)}
                  className={inputStyle}
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                  <option value="Minggu">Minggu</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Tanggal Pembelajaran (Kalender) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-tanggal"
                  type="date"
                  required
                  min="2024-01-01"
                  max="2030-12-31"
                  value={tanggal}
                  onChange={handleTanggalChange}
                  className={`${inputStyle} ${isLight ? '' : 'scheme-dark'}`}
                />
                {fieldErrors.tanggal && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.tanggal}</p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================
              MENU 2: JAM KE (1 - 10)
             ======================================================== */}
          <div className={`${cardStyle} ${fieldErrors.jamKe ? 'border-rose-500' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={numBadgeStyle}>2</span>
                <label className={labelStyle}>
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Jam ke (1 - 10) & Durasi Mengajar</span>
                </label>
              </div>

              {/* Live Duration Badge */}
              <div
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                }`}
              >
                <span>Durasi: {parsedJam.jp} JP ({parsedJam.jp * 45} Menit)</span>
                <span>•</span>
                <span>{parsedJam.startTime} - {parsedJam.endTime} WIB</span>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Pilih Jam Pelajaran / Rentang Jam Mengajar <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-jam-ke"
                value={jamKe}
                onChange={(e) => {
                  setJamKe(e.target.value);
                  if (fieldErrors.jamKe) setFieldErrors(prev => ({ ...prev, jamKe: '' }));
                }}
                className={inputStyle}
              >
                {DAFTAR_JAM_KE.map((jam, idx) => (
                  <option key={idx} value={jam}>
                    {jam}
                  </option>
                ))}
              </select>
              {fieldErrors.jamKe && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.jamKe}</p>
              )}
            </div>
          </div>

          {/* ========================================================
              MENU 3: NAMA GURU
             ======================================================== */}
          <div className={`${cardStyle} ${fieldErrors.namaGuru ? 'border-rose-500' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={numBadgeStyle}>3</span>
                <label className={labelStyle}>
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Nama Guru Pengampu</span>
                </label>
              </div>
              <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Total {DAFTAR_GURU.length} Guru SMKN Bojonggambir
              </span>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Pilih Guru dari Daftar Dropdown <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-nama-guru"
                required
                value={namaGuru}
                onChange={(e) => {
                  setNamaGuru(e.target.value);
                  if (fieldErrors.namaGuru) setFieldErrors(prev => ({ ...prev, namaGuru: '' }));
                }}
                className={inputStyle}
              >
                <option value="">-- Klik untuk Memilih Nama Guru --</option>
                {DAFTAR_GURU.map((guru) => (
                  <option key={guru} value={guru}>
                    {guru} - Guru SMKN Bojonggambir
                  </option>
                ))}
              </select>
              {fieldErrors.namaGuru && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.namaGuru}</p>
              )}
            </div>

            {/* Quick Guru Badges */}
            <div className="mt-3">
              <div className={`text-[11px] mb-1.5 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Pilihan Cepat:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1">
                {DAFTAR_GURU.map((guru) => (
                  <button
                    key={guru}
                    type="button"
                    onClick={() => {
                      setNamaGuru(guru);
                      if (fieldErrors.namaGuru) setFieldErrors(prev => ({ ...prev, namaGuru: '' }));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      namaGuru === guru
                        ? isLight
                          ? 'bg-emerald-700 text-white font-bold shadow-sm'
                          : 'bg-amber-400 text-slate-950 font-bold border border-amber-300'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    {guru}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================
              MENU 4: JURUSAN & KELAS
             ======================================================== */}
          <div className={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <span className={numBadgeStyle}>4</span>
              <label className={labelStyle}>
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Jurusan dan Kelas</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dropdown Jurusan */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Jurusan (Keahlian)
                </label>
                <select
                  id="select-jurusan"
                  value={jurusan}
                  onChange={(e) => handleJurusanChange(e.target.value)}
                  className={inputStyle}
                >
                  <option value="DKV">DKV (Desain Komunikasi Visual)</option>
                  <option value="APHP">APHP (Agribisnis Pengolahan Hasil Pertanian)</option>
                </select>
                <div className={`text-[11px] mt-1 font-medium ${isLight ? 'text-emerald-700' : 'text-amber-300/80'}`}>
                  Konsentrasi: {jurusan === 'DKV' ? 'Desain Komunikasi Visual' : 'Agribisnis Pengolahan Hasil Pertanian'}
                </div>
              </div>

              {/* Dropdown Kelas */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Kelas (Rombongan Belajar) <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-kelas"
                  required
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className={inputStyle}
                >
                  {DAFTAR_KELAS.map((k) => (
                    <option key={k.nama} value={k.nama}>
                      {k.nama} - Jurusan {k.jurusan}
                    </option>
                  ))}
                </select>
                <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Tersedia 10 Rombel (Tingkat X, XI, XII)
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              MENU 5: MATA PELAJARAN (Lengkap SMK)
             ======================================================== */}
          <div className={cardStyle}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={numBadgeStyle}>5</span>
                <label className={labelStyle}>
                  <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mata Pelajaran (Kejuruan & Umum SMK)</span>
                </label>
              </div>

              {/* Quick Filter tabs */}
              <div className="flex items-center gap-1 text-xs">
                {['Semua', 'Kejuruan', 'Umum'].map((kategori) => (
                  <button
                    key={kategori}
                    type="button"
                    onClick={() => setFilterKategoriMapel(kategori)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterKategoriMapel === kategori
                        ? isLight
                          ? 'bg-emerald-700 text-white'
                          : 'bg-amber-400 text-slate-950'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {kategori}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Pilih Mata Pelajaran dari Dropdown <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-mata-pelajaran"
                required
                value={mataPelajaran}
                onChange={(e) => setMataPelajaran(e.target.value)}
                className={inputStyle}
              >
                <optgroup label="-- Kejuruan DKV --">
                  {DAFTAR_MAPEL.filter(m => m.kategori === 'Kejuruan DKV').map(m => (
                    <option key={m.nama} value={m.nama}>
                      {m.nama}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="-- Kejuruan APHP --">
                  {DAFTAR_MAPEL.filter(m => m.kategori === 'Kejuruan APHP').map(m => (
                    <option key={m.nama} value={m.nama}>
                      {m.nama}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="-- Mata Pelajaran Umum & Muatan Lokal --">
                  {DAFTAR_MAPEL.filter(m => m.kategori === 'Umum' || m.kategori === 'Muatan Lokal / P5').map(m => (
                    <option key={m.nama} value={m.nama}>
                      {m.nama} ({m.kategori})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* ========================================================
              MENU 6: TUJUAN (Tujuan Pembelajaran / TP)
             ======================================================== */}
          <div className={`${cardStyle} ${fieldErrors.tujuan ? 'border-rose-500' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={numBadgeStyle}>6</span>
                <label className={labelStyle}>
                  <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tujuan Pembelajaran (TP) & Materi Pokok</span>
                </label>
              </div>
              <span
                className={`text-xs font-semibold ${
                  tujuan.trim().length >= 10
                    ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                    : isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {tujuan.trim().length} karakter (min 10)
              </span>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Uraian Capaian / Tujuan Pembelajaran pada jam pertemuan ini <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="textarea-tujuan"
                rows={3}
                required
                value={tujuan}
                onChange={(e) => {
                  setTujuan(e.target.value);
                  if (fieldErrors.tujuan) setFieldErrors(prev => ({ ...prev, tujuan: '' }));
                }}
                placeholder="Contoh: Peserta didik mampu merancang layout publikasi digital menggunakan perangkat lunak desain sesuai prinsip tata letak dan estetika visual..."
                className={inputStyle}
              />
              {fieldErrors.tujuan && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.tujuan}</p>
              )}
            </div>

            {/* Template Cepat Tujuan Pembelajaran */}
            <div className="mt-3">
              <div className={`text-[11px] font-semibold mb-1.5 ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
                💡 Contoh Template TP Kurikulum Merdeka (Klik untuk Menyalin):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {CONTOH_TEMPLATE_TUJUAN.slice(0, 4).map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplateTujuan(tpl)}
                    className={`text-left p-2 rounded-lg text-[11px] transition-all cursor-pointer line-clamp-2 border ${
                      isLight
                        ? 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200'
                        : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-amber-200 border-slate-700'
                    }`}
                  >
                    + {tpl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================
              MENU 7: MODEL ATAU METODE
             ======================================================== */}
          <div className={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <span className={numBadgeStyle}>7</span>
              <label className={labelStyle}>
                <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Model / Metode Pembelajaran</span>
              </label>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Pilih Model / Metode yang Digunakan
              </label>
              <select
                id="select-model-metode"
                value={modelMetode}
                onChange={(e) => setModelMetode(e.target.value)}
                className={inputStyle}
              >
                {DAFTAR_MODEL_METODE.map((m) => (
                  <option key={m.kode} value={m.kode}>
                    {m.kode} - {m.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Pills for Model / Metode */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
              {DAFTAR_MODEL_METODE.map((m) => (
                <button
                  key={m.kode}
                  type="button"
                  onClick={() => setModelMetode(m.kode)}
                  className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                    modelMetode === m.kode
                      ? isLight
                        ? 'bg-emerald-700 text-white font-bold border-emerald-800 shadow-sm'
                        : 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md'
                      : isLight
                      ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 text-xs'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border-slate-700 text-xs'
                  }`}
                >
                  <div className="font-extrabold text-xs">{m.kode}</div>
                  <div className="text-[10px] truncate opacity-80">{m.nama.split('(')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================
              MENU 8: ASESMEN (Formatif & Sumatif)
             ======================================================== */}
          <div className={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <span className={numBadgeStyle}>8</span>
              <label className={labelStyle}>
                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Asesmen (Formatif & Sumatif)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 8a. Asesmen Formatif */}
              <div
                className={`p-4 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
                    8a. Asesmen Formatif
                  </span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedFormatif.length} Terpilih
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OPSI_ASESMEN_FORMATIF.map((opt) => {
                    const isChecked = selectedFormatif.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleFormatif(opt)}
                        className={`p-2 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition-all cursor-pointer border ${
                          isChecked
                            ? isLight
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold'
                              : 'bg-amber-500/25 text-amber-200 border-amber-400 font-semibold'
                            : isLight
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            isChecked
                              ? isLight ? 'bg-emerald-700 text-white font-bold' : 'bg-amber-400 text-slate-950 font-bold'
                              : isLight ? 'border border-slate-300' : 'border border-slate-500'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 8b. Asesmen Sumatif */}
              <div
                className={`p-4 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
                    8b. Asesmen Sumatif
                  </span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedSumatif.length} Terpilih
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OPSI_ASESMEN_SUMATIF.map((opt) => {
                    const isChecked = selectedSumatif.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleSumatif(opt)}
                        className={`p-2 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition-all cursor-pointer border ${
                          isChecked
                            ? isLight
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold'
                              : 'bg-amber-500/25 text-amber-200 border-amber-400 font-semibold'
                            : isLight
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            isChecked
                              ? isLight ? 'bg-emerald-700 text-white font-bold' : 'bg-amber-400 text-slate-950 font-bold'
                              : isLight ? 'border border-slate-300' : 'border border-slate-500'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              ITEM PENDUKUNG: PRESENSI & CATATAN KEJADIAN KELAS
             ======================================================== */}
          <div className={`${cardStyle} ${fieldErrors.kehadiran ? 'border-rose-500' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <label className={labelStyle}>
                  <span>Presensi Siswa & Catatan Kejadian Kelas</span>
                </label>
              </div>

              {/* Total & Attendance Ratio Live Badge */}
              <div
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-emerald-950 text-emerald-200 border-emerald-700'
                }`}
              >
                Total: {totalSiswa} Siswa • Kehadiran {persentaseHadir}%
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <label className="block text-[11px] font-bold text-emerald-600 mb-1">Hadir (H)</label>
                <input
                  type="number"
                  min="0"
                  value={kehadiran.hadir}
                  onChange={(e) => setKehadiran({ ...kehadiran, hadir: Math.max(0, parseInt(e.target.value) || 0) })}
                  className={`w-full p-2 text-center font-bold text-base rounded-lg border outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                  }`}
                />
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <label className="block text-[11px] font-bold text-amber-600 mb-1">Sakit (S)</label>
                <input
                  type="number"
                  min="0"
                  value={kehadiran.sakit}
                  onChange={(e) => setKehadiran({ ...kehadiran, sakit: Math.max(0, parseInt(e.target.value) || 0) })}
                  className={`w-full p-2 text-center font-bold text-base rounded-lg border outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                  }`}
                />
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <label className="block text-[11px] font-bold text-blue-600 mb-1">Izin (I)</label>
                <input
                  type="number"
                  min="0"
                  value={kehadiran.izin}
                  onChange={(e) => setKehadiran({ ...kehadiran, izin: Math.max(0, parseInt(e.target.value) || 0) })}
                  className={`w-full p-2 text-center font-bold text-base rounded-lg border outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                  }`}
                />
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <label className="block text-[11px] font-bold text-rose-600 mb-1">Alfa (A)</label>
                <input
                  type="number"
                  min="0"
                  value={kehadiran.alfa}
                  onChange={(e) => setKehadiran({ ...kehadiran, alfa: Math.max(0, parseInt(e.target.value) || 0) })}
                  className={`w-full p-2 text-center font-bold text-base rounded-lg border outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
                  }`}
                />
              </div>
            </div>

            {fieldErrors.kehadiran && (
              <p className="text-xs text-rose-500 mb-3 font-medium">{fieldErrors.kehadiran}</p>
            )}

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Catatan Refleksi Guru / Kejadian Khusus di Kelas (Opsional)
              </label>
              <input
                type="text"
                value={catatanKejadian}
                onChange={(e) => setCatatanKejadian(e.target.value)}
                placeholder="Misal: Siswa sangat aktif saat praktik unjuk kerja, 2 siswa bimbingan remedial portofolio..."
                className={inputStyle}
              />
            </div>
          </div>

          {/* ========================================================
              TOMBOL SIMPAN KE SPREADSHEET & DATABASE
             ======================================================== */}
          <div className="pt-2">
            <button
              id="btn-submit-agenda"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base md:text-lg transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg ${
                isLight
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Google Spreadsheet & Database...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>SIMPAN KE AGENDA KELAS & SPREADSHEET</span>
                </>
              )}
            </button>
            <p className={`text-center text-xs mt-2 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Data tersimpan otomatis di Spreadsheet Google & Jurnal Administrasi SMKN Bojonggambir.
            </p>
          </div>

        </form>

      </div>
    </div>
  );
};
