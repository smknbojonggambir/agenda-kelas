import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Layers,
  Award,
  Users,
  PieChart,
  HelpCircle,
  FileCode,
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AgendaEntry, ReportFilter, ThemeMode } from '../types';
import { DAFTAR_GURU, DAFTAR_KELAS, DAFTAR_JURUSAN, SMKN_LOGO_URL } from '../constants/agendaData';
import { filterAgendaEntries, calculateReportSummary, parseJamKe } from '../utils/agendaUtils';

interface ReportDashboardProps {
  entries: AgendaEntry[];
  onOpenPrintReport: (filter: ReportFilter) => void;
  onOpenScriptGuide: () => void;
  theme?: ThemeMode;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  entries,
  onOpenPrintReport,
  onOpenScriptGuide,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  const [filter, setFilter] = useState<ReportFilter>({
    period: 'this_month',
    startDate: '',
    endDate: '',
    selectedGuru: 'Semua',
    selectedJurusan: 'Semua',
    selectedKelas: 'Semua'
  });

  // Chart view mode: 'trend' (Area) | 'comparison' (Bar DKV vs APHP) | 'sessions' (Bar Sesi vs Jam)
  const [chartMode, setChartMode] = useState<'trend' | 'comparison' | 'sessions'>('trend');

  // Calculate filtered entries & analytics
  const filteredEntries = useMemo(() => {
    return filterAgendaEntries(entries, filter);
  }, [entries, filter]);

  const summary = useMemo(() => {
    return calculateReportSummary(filteredEntries);
  }, [filteredEntries]);

  // Compute weekly trend data for Recharts visualization
  const weeklyTrendData = useMemo(() => {
    const source = filteredEntries.length > 0 ? filteredEntries : entries;
    if (source.length === 0) return [];

    const sorted = [...source].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    const weekMap = new Map<
      string,
      {
        label: string;
        startDate: Date;
        totalJam: number;
        totalSesi: number;
        dkvJam: number;
        aphpJam: number;
        hadirSum: number;
        totalSiswaSum: number;
      }
    >();

    sorted.forEach((entry) => {
      const d = new Date(entry.tanggal);
      if (isNaN(d.getTime())) return;

      const day = d.getDay(); // 0 is Sunday
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const weekKey = monday.toISOString().split('T')[0];

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startDay = monday.getDate();
      const endDay = sunday.getDate();
      const monthName = monday.toLocaleDateString('id-ID', { month: 'short' });
      const label = `${startDay}-${endDay} ${monthName}`;

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          label,
          startDate: monday,
          totalJam: 0,
          totalSesi: 0,
          dkvJam: 0,
          aphpJam: 0,
          hadirSum: 0,
          totalSiswaSum: 0
        });
      }

      const bucket = weekMap.get(weekKey)!;
      const jamCount = parseJamKe(entry.jamKe).jamCount || 3;
      bucket.totalJam += jamCount;
      bucket.totalSesi += 1;

      if (entry.jurusan === 'DKV' || entry.kelas.includes('DKV')) {
        bucket.dkvJam += jamCount;
      } else if (entry.jurusan === 'APHP' || entry.kelas.includes('APHP')) {
        bucket.aphpJam += jamCount;
      }

      if (entry.kehadiran) {
        const h = entry.kehadiran.hadir || 0;
        const s = entry.kehadiran.sakit || 0;
        const iz = entry.kehadiran.izin || 0;
        const a = entry.kehadiran.alfa || 0;
        bucket.hadirSum += h;
        bucket.totalSiswaSum += h + s + iz + a;
      }
    });

    const items = Array.from(weekMap.entries())
      .sort((a, b) => a[1].startDate.getTime() - b[1].startDate.getTime())
      .map(([key, val], idx) => {
        const rate =
          val.totalSiswaSum > 0
            ? Math.round((val.hadirSum / val.totalSiswaSum) * 100)
            : 100;
        const avgJam =
          val.totalSesi > 0
            ? Number((val.totalJam / val.totalSesi).toFixed(1))
            : 0;
        return {
          key,
          label: `Minggu ${idx + 1} (${val.label})`,
          shortLabel: `M${idx + 1} ${val.label}`,
          totalJam: val.totalJam,
          totalSesi: val.totalSesi,
          dkvJam: val.dkvJam,
          aphpJam: val.aphpJam,
          kehadiranRate: rate,
          avgJamPerSesi: avgJam
        };
      });

    return items;
  }, [entries, filteredEntries]);

  // Statistics derived from weekly trends
  const trendStats = useMemo(() => {
    if (weeklyTrendData.length === 0) {
      return { peakJam: 0, avgWeeklyJam: 0, activeWeeks: 0, totalHours: 0 };
    }
    const totalHours = weeklyTrendData.reduce((acc, item) => acc + item.totalJam, 0);
    const peakJam = Math.max(...weeklyTrendData.map((d) => d.totalJam));
    const avgWeeklyJam = Number((totalHours / weeklyTrendData.length).toFixed(1));
    return {
      peakJam,
      avgWeeklyJam,
      activeWeeks: weeklyTrendData.length,
      totalHours
    };
  }, [weeklyTrendData]);

  // Export CSV of the summary
  const exportSummaryCSV = () => {
    if (summary.guruBeban.length === 0) {
      alert('Tidak ada data laporan untuk diekspor.');
      return;
    }

    const headers = [
      'Nama Guru',
      'Total Jam Mengajar (JP)',
      'Total Sesi',
      'Daftar Mapel',
      'Daftar Kelas',
      'Jml Asesmen Formatif',
      'Jml Asesmen Sumatif'
    ];
    const rows = summary.guruBeban.map((g) => [
      `"${g.namaGuru}"`,
      g.totalJam,
      g.totalSesi,
      `"${g.daftarMapel.join(', ')}"`,
      `"${g.daftarKelas.join(', ')}"`,
      g.asesmenFormatifCount,
      g.asesmenSumatifCount
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `LAPORAN_AGENDA_SMKN_BOJONGGAMBIR_${filter.period.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cardStyle = isLight
    ? 'bg-white border border-slate-200 shadow-sm rounded-2xl p-5 md:p-6 transition-all'
    : 'bg-slate-900/90 border border-slate-800 shadow-xl rounded-2xl p-5 md:p-6 transition-all';

  const selectStyle = isLight
    ? 'w-full bg-slate-50 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs border border-slate-300 focus:border-emerald-600 focus:outline-none'
    : 'w-full bg-slate-950 text-white rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 focus:border-emerald-400 focus:outline-none';

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div
        className={`rounded-2xl p-5 md:p-6 transition-all ${
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
                  Laporan Kurikulum Merdeka
                </span>
                <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Periode:{' '}
                  {filter.period === 'all'
                    ? 'Semua Periode'
                    : filter.period === 'today'
                    ? 'Hari Ini'
                    : filter.period === 'this_week'
                    ? 'Mingguan (7 Hari)'
                    : filter.period === 'this_month'
                    ? 'Bulanan (Bulan Ini)'
                    : 'Rentang Kustom'}
                </span>
              </div>
              <h2
                className={`text-xl md:text-2xl font-bold font-brand mt-1 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Laporan & Rekapitulasi Pembelajaran
              </h2>
              <p className={`text-xs md:text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Analisis beban jam mengajar guru, mata pelajaran yang diajarkan, serta distribusi jenis asesmen formatif & sumatif.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenPrintReport(filter)}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Resmi</span>
            </button>

            <button
              onClick={exportSummaryCSV}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          className={`mt-5 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          {/* Period Selector */}
          <div>
            <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Calendar className="w-3 h-3 text-emerald-600" /> Periode Laporan:
            </label>
            <select
              value={filter.period}
              onChange={(e) => setFilter({ ...filter, period: e.target.value as ReportFilter['period'] })}
              className={selectStyle}
            >
              <option value="this_month">Bulanan (Bulan Ini)</option>
              <option value="this_week">Mingguan (7 Hari Terakhir)</option>
              <option value="today">Hari Ini</option>
              <option value="all">Semua Data Tersedia</option>
              <option value="custom">Rentang Tanggal Kustom</option>
            </select>
          </div>

          {/* Teacher Selector */}
          <div>
            <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <User className="w-3 h-3 text-emerald-600" /> Filter Guru:
            </label>
            <select
              value={filter.selectedGuru}
              onChange={(e) => setFilter({ ...filter, selectedGuru: e.target.value })}
              className={selectStyle}
            >
              <option value="Semua">Semua Guru (19 Guru)</option>
              {DAFTAR_GURU.map((guru) => (
                <option key={guru} value={guru}>
                  {guru}
                </option>
              ))}
            </select>
          </div>

          {/* Jurusan Selector */}
          <div>
            <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Layers className="w-3 h-3 text-emerald-600" /> Filter Jurusan:
            </label>
            <select
              value={filter.selectedJurusan}
              onChange={(e) => setFilter({ ...filter, selectedJurusan: e.target.value })}
              className={selectStyle}
            >
              <option value="Semua">Semua Jurusan</option>
              {DAFTAR_JURUSAN.map((j) => (
                <option key={j.kode} value={j.kode}>
                  {j.kode} - {j.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Kelas Selector */}
          <div>
            <label className={`block text-[11px] font-bold mb-1 flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Users className="w-3 h-3 text-emerald-600" /> Filter Kelas:
            </label>
            <select
              value={filter.selectedKelas}
              onChange={(e) => setFilter({ ...filter, selectedKelas: e.target.value })}
              className={selectStyle}
            >
              <option value="Semua">Semua Kelas (10 Rombel)</option>
              {DAFTAR_KELAS.map((k) => (
                <option key={k.nama} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range if selected */}
          {filter.period === 'custom' && (
            <div className="sm:col-span-2 md:col-span-4 lg:col-span-1 flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 mb-0.5">Dari:</label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  className={selectStyle}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 mb-0.5">Sampai:</label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                  className={selectStyle}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* METRIC SUMMARY CARDS (4 Key Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Teaching Hours */}
        <div
          className={`p-4 rounded-xl flex items-center gap-3.5 shadow-sm border ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Jam Mengajar</div>
            <div className={`text-2xl font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {summary.totalJamMengajar}{' '}
              <span className={`text-xs font-normal ${isLight ? 'text-emerald-700' : 'text-amber-300'}`}>JP</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {summary.totalSesi} Sesi Pertemuan Terdata
            </div>
          </div>
        </div>

        {/* Average JP / Session */}
        <div
          className={`p-4 rounded-xl flex items-center gap-3.5 shadow-sm border ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
            }`}
          >
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Rata-Rata Beban JP</div>
            <div className={`text-2xl font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {summary.rataRataJamPerSesi}{' '}
              <span className={`text-xs font-normal ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>JP / Sesi</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Alokasi waktu rata-rata
            </div>
          </div>
        </div>

        {/* Active Teachers in Period */}
        <div
          className={`p-4 rounded-xl flex items-center gap-3.5 shadow-sm border ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
            }`}
          >
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Guru Aktif Melapor</div>
            <div className={`text-2xl font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {summary.guruBeban.length}{' '}
              <span className={`text-xs font-normal ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>Guru</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Dari 19 Tenaga Pendidik
            </div>
          </div>
        </div>

        {/* Student Attendance Rate */}
        <div
          className={`p-4 rounded-xl flex items-center gap-3.5 shadow-sm border ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-purple-500/20 text-purple-300 border-purple-400/40'
            }`}
          >
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tingkat Kehadiran Siswa</div>
            <div className={`text-2xl font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {summary.kehadiranRekap.persentaseKehadiran}%
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Hadir: {summary.kehadiranRekap.totalHadir} | Sakit: {summary.kehadiranRekap.totalSakit} | Izin: {summary.kehadiranRekap.totalIzin} | Alfa: {summary.kehadiranRekap.totalAlfa}
            </div>
          </div>
        </div>

      </div>

      {/* RECHARTS WEEKLY TEACHING HOURS TREND VISUALIZATION CARD */}
      <div
        id="weekly-teaching-trend-chart"
        className={`rounded-2xl p-5 md:p-6 transition-all border shadow-md ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/60'
            : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}
      >
        {/* Top Header of Chart Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-base md:text-lg font-bold font-brand tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Tren Jumlah Jam Mengajar per Minggu
                </h3>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <Activity className="w-2.5 h-2.5" /> Recharts Live
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Visualisasi dinamika beban jam pembelajaran (JP) dan frekuensi tatap muka antar pekan
              </p>
            </div>
          </div>

          {/* Chart Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setChartMode('trend')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMode === 'trend'
                  ? isLight
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                    : 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Area Tren JP
            </button>
            <button
              onClick={() => setChartMode('comparison')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMode === 'comparison'
                  ? isLight
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                    : 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DKV vs APHP
            </button>
            <button
              onClick={() => setChartMode('sessions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMode === 'sessions'
                  ? isLight
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                    : 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JP vs Sesi
            </button>
          </div>
        </div>

        {/* Quick Highlights / Mini Metric Ribbons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div
            className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pekan Terdata</div>
            <div className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {trendStats.activeWeeks} <span className="text-xs font-normal">Minggu</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Rata-Rata JP/Minggu</div>
            <div className={`text-lg font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {trendStats.avgWeeklyJam} <span className="text-xs font-normal">JP</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Puncak Beban Mingguan</div>
            <div className={`text-lg font-bold font-mono ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
              {trendStats.peakJam} <span className="text-xs font-normal">JP Terbanyak</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Akumulasi JP</div>
            <div className={`text-lg font-bold font-mono ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
              {trendStats.totalHours} <span className="text-xs font-normal">Jam Pelajaran</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart Area */}
        <div className="w-full h-72 sm:h-80 mt-2">
          {weeklyTrendData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
              <Calendar className="w-10 h-10 text-slate-400 mb-2" />
              <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Belum ada data pembelajaran pada periode yang dipilih.
              </p>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Silakan ubah filter periode atau tambahkan entri agenda baru pada formulir.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'trend' ? (
                <AreaChart
                  data={weeklyTrendData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorJamTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isLight ? '#059669' : '#10b981'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isLight ? '#059669' : '#10b981'} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorSesiTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isLight ? '#d97706' : '#f59e0b'} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={isLight ? '#d97706' : '#f59e0b'} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? '#e2e8f0' : '#334155'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
                  />
                  <YAxis
                    tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
                    unit=" JP"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#0f172a',
                      borderColor: isLight ? '#cbd5e1' : '#334155',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                      fontSize: '12px',
                      color: isLight ? '#0f172a' : '#f8fafc'
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'totalJam') return [`${value} Jam (JP)`, 'Total Jam Mengajar'];
                      if (name === 'totalSesi') return [`${value} Pertemuan`, 'Jumlah Sesi'];
                      if (name === 'kehadiranRate') return [`${value}%`, 'Presensi Siswa'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Periode: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                    formatter={(value) => {
                      if (value === 'totalJam') return isLight ? 'Total Jam Mengajar (JP)' : 'Total Jam Mengajar (JP)';
                      if (value === 'totalSesi') return 'Jumlah Sesi Tatap Muka';
                      return value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalJam"
                    name="totalJam"
                    stroke={isLight ? '#059669' : '#10b981'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorJamTrend)"
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalSesi"
                    name="totalSesi"
                    stroke={isLight ? '#d97706' : '#f59e0b'}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorSesiTrend)"
                  />
                </AreaChart>
              ) : chartMode === 'comparison' ? (
                <BarChart
                  data={weeklyTrendData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? '#e2e8f0' : '#334155'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
                  />
                  <YAxis
                    tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
                    unit=" JP"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#0f172a',
                      borderColor: isLight ? '#cbd5e1' : '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: isLight ? '#0f172a' : '#f8fafc'
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'dkvJam') return [`${value} JP`, 'Desain Komunikasi Visual (DKV)'];
                      if (name === 'aphpJam') return [`${value} JP`, 'Agribisnis Pengolahan Hasil Pertanian (APHP)'];
                      return [value, name];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                    formatter={(value) => {
                      if (value === 'dkvJam') return 'Konsentrasi DKV (JP)';
                      if (value === 'aphpJam') return 'Konsentrasi APHP (JP)';
                      return value;
                    }}
                  />
                  <Bar
                    dataKey="dkvJam"
                    name="dkvJam"
                    fill={isLight ? '#059669' : '#10b981'}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="aphpJam"
                    name="aphpJam"
                    fill={isLight ? '#d97706' : '#f59e0b'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={weeklyTrendData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? '#e2e8f0' : '#334155'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
                  />
                  <YAxis
                    tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#0f172a',
                      borderColor: isLight ? '#cbd5e1' : '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: isLight ? '#0f172a' : '#f8fafc'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                    formatter={(value) => {
                      if (value === 'totalJam') return 'Total Jam Pelajaran (JP)';
                      if (value === 'totalSesi') return 'Jumlah Pertemuan / Sesi';
                      if (value === 'avgJamPerSesi') return 'Rata-rata JP per Sesi';
                      return value;
                    }}
                  />
                  <Bar
                    dataKey="totalJam"
                    name="totalJam"
                    fill={isLight ? '#059669' : '#10b981'}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="totalSesi"
                    name="totalSesi"
                    fill={isLight ? '#3b82f6' : '#60a5fa'}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgJamPerSesi"
                    name="avgJamPerSesi"
                    fill={isLight ? '#8b5cf6' : '#a78bfa'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* SECTION 1: TEACHER WORKLOAD & SUBJECT SUMMARY TABLE */}
      <div className={cardStyle}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Rangkuman Beban Jam Mengajar per Guru
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Rincian akumulasi jam pelajaran (JP), mata pelajaran, dan kelas yang diampu
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-950/60 text-amber-300 border-amber-400/30'
            }`}
          >
            {summary.guruBeban.length} Guru Terdata
          </span>
        </div>

        {summary.guruBeban.length === 0 ? (
          <div className={`text-center py-8 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Tidak ada data sesi pembelajaran pada filter periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-bold ${
                    isLight
                      ? 'bg-emerald-800 text-white border-emerald-900'
                      : 'bg-slate-950 text-amber-300 border-slate-800'
                  }`}
                >
                  <th className="p-3">Nama Guru</th>
                  <th className="p-3 text-center">Total Jam (JP)</th>
                  <th className="p-3 text-center">Sesi</th>
                  <th className="p-3">Mata Pelajaran yang Diajarkan</th>
                  <th className="p-3">Kelas yang Diampu</th>
                  <th className="p-3 text-center">Asesmen Formatif</th>
                  <th className="p-3 text-center">Asesmen Sumatif</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'}`}>
                {summary.guruBeban.map((guru) => (
                  <tr
                    key={guru.namaGuru}
                    className={`transition-colors ${isLight ? 'hover:bg-emerald-50/70' : 'hover:bg-slate-800/60'}`}
                  >
                    <td className="p-3 font-bold flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-emerald-950 border-slate-700 text-amber-300'
                        }`}
                      >
                        {guru.namaGuru.substring(0, 2).toUpperCase()}
                      </span>
                      <span>Bpk/Ibu Guru {guru.namaGuru}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700 dark:text-amber-300 text-sm">
                      {guru.totalJam} JP
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">
                      {guru.totalSesi}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {guru.daftarMapel.map((m, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[11px] border ${
                              isLight
                                ? 'bg-slate-100 text-slate-800 border-slate-200'
                                : 'bg-slate-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {guru.daftarKelas.map((k, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[11px] border ${
                              isLight
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-slate-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      {guru.asesmenFormatifCount} item
                    </td>
                    <td className="p-3 text-center font-mono text-amber-700 dark:text-amber-300 font-semibold">
                      {guru.asesmenSumatifCount} item
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: ASSESSMENTS BREAKDOWN (Formatif & Sumatif) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Formative Assessments */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Distribusi Asesmen Formatif
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Frekuensi pemantauan proses belajar selama sesi pembelajaran
              </p>
            </div>
          </div>

          {summary.formatifBreakdown.length === 0 ? (
            <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Belum ada data asesmen formatif.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.formatifBreakdown.map((item) => (
                <div key={item.jenis} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.jenis}</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{item.count} kali ({item.percentage}%)</span>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summative Assessments */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isLight
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              }`}
            >
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Distribusi Asesmen Sumatif
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Instrumen penilaian capaian akhir modul dan produk/kinerja siswa
              </p>
            </div>
          </div>

          {summary.sumatifBreakdown.length === 0 ? (
            <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Belum ada data asesmen sumatif.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.sumatifBreakdown.map((item) => (
                <div key={item.jenis} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.jenis}</span>
                    <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{item.count} kali ({item.percentage}%)</span>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SECTION 3: LEARNING MODEL & SUBJECT BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Model Pembelajaran Kurikulum Merdeka */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isLight
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Model Pembelajaran yang Diterapkan
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                PJBL, PBL, DL, Inquiry, SETS, DTBL, STEAM
              </p>
            </div>
          </div>

          {summary.modelBreakdown.length === 0 ? (
            <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Belum ada data model pembelajaran.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.modelBreakdown.map((item) => (
                <div key={item.model} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.model}</span>
                    <span className="font-mono text-blue-700 dark:text-blue-300 font-bold">{item.count} sesi ({item.percentage}%)</span>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subjects Breakdown */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isLight
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-purple-500/20 text-purple-300 border-purple-400/40'
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Beban Jam per Mata Pelajaran
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Total alokasi JP per mapel kejuruan & umum
              </p>
            </div>
          </div>

          {summary.mapelBreakdown.length === 0 ? (
            <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Belum ada data mapel.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {summary.mapelBreakdown.map((item) => (
                <div
                  key={item.mapel}
                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs border ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-950/70 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate">{item.mapel}</div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.jurusan} • {item.sesi} kali pertemuan
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold px-2.5 py-1 rounded border shrink-0 ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {item.totalJam} JP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Script Integration Callout */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isLight
            ? 'bg-emerald-50/80 border-emerald-200'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-emerald-200/60 text-emerald-900 border-emerald-300'
                : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
            }`}
          >
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Otomatisasi Laporan di Google Spreadsheet (Code.gs)
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Buat sheet rekap mingguan/bulanan otomatis dengan formula & Apps Script trigger di spreadsheet Anda.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenScriptGuide}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-sm"
        >
          <FileCode className="w-4 h-4" />
          <span>Buka Panduan Script Laporan</span>
        </button>
      </div>

    </div>
  );
};
