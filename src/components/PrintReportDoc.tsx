import React, { useState, useMemo } from 'react';
import { Printer, ArrowLeft, Download, FileText } from 'lucide-react';
import { AgendaEntry, ReportFilter } from '../types';
import { filterAgendaEntries, calculateReportSummary } from '../utils/agendaUtils';
import { SMKN_LOGO_URL } from '../constants/agendaData';

interface PrintReportDocProps {
  entries: AgendaEntry[];
  initialFilter?: ReportFilter;
  onBack: () => void;
}

export const PrintReportDoc: React.FC<PrintReportDocProps> = ({
  entries,
  initialFilter,
  onBack
}) => {
  const [filter] = useState<ReportFilter>(
    initialFilter || {
      period: 'this_month',
      startDate: '',
      endDate: '',
      selectedGuru: 'Semua',
      selectedJurusan: 'Semua',
      selectedKelas: 'Semua'
    }
  );

  const [kepalaSekolah, setKepalaSekolah] = useState('Drs. H. Sukmana, M.Pd.');
  const [nipKepsek, setNipKepsek] = useState('19680512 199403 1 008');
  const [wakasekKurikulum, setWakasekKurikulum] = useState('Dini, S.Pd.');
  const [nipWakasek, setNipWakasek] = useState('19850614 201001 2 015');

  const filteredEntries = useMemo(() => {
    return filterAgendaEntries(entries, filter);
  }, [entries, filter]);

  const summary = useMemo(() => {
    return calculateReportSummary(filteredEntries);
  }, [filteredEntries]);

  const handlePrint = () => {
    window.print();
  };

  const getPeriodeLabel = () => {
    if (filter.period === 'today') return 'Harian (Hari Ini)';
    if (filter.period === 'this_week') return 'Mingguan (7 Hari Terakhir)';
    if (filter.period === 'this_month') {
      const now = new Date();
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `Bulanan - Bulan ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
    if (filter.period === 'custom') {
      return `Rentang ${filter.startDate || 'Awal'} s/d ${filter.endDate || 'Akhir'}`;
    }
    return 'Semua Periode / Semester Berjalan';
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Control Panel (Hidden during Print) */}
      <div className="bg-emerald-950/80 rounded-2xl p-5 md:p-6 silver-border no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Format Cetak Laporan Rekapitulasi Pembelajaran</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Dokumen resmi rekapitulasi beban mengajar guru, mata pelajaran, dan asesmen SMKN Bojonggambir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-500/40 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-amber-600 text-white border border-amber-300/40 shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Edit Signatory Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700/60 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nama Kepala Sekolah & NIP:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={kepalaSekolah}
                onChange={(e) => setKepalaSekolah(e.target.value)}
                className="w-1/2 bg-emerald-900/80 text-white px-2 py-1 rounded border border-slate-600"
                placeholder="Nama Kepala Sekolah"
              />
              <input
                type="text"
                value={nipKepsek}
                onChange={(e) => setNipKepsek(e.target.value)}
                className="w-1/2 bg-emerald-900/80 text-white px-2 py-1 rounded border border-slate-600"
                placeholder="NIP Kepala Sekolah"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nama Wakasek Kurikulum & NIP:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={wakasekKurikulum}
                onChange={(e) => setWakasekKurikulum(e.target.value)}
                className="w-1/2 bg-emerald-900/80 text-white px-2 py-1 rounded border border-slate-600"
                placeholder="Nama Wakasek Kurikulum"
              />
              <input
                type="text"
                value={nipWakasek}
                onChange={(e) => setNipWakasek(e.target.value)}
                className="w-1/2 bg-emerald-900/80 text-white px-2 py-1 rounded border border-slate-600"
                placeholder="NIP Wakasek"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE A4 WHITE SHEET */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl max-w-5xl mx-auto print-container font-serif border border-slate-300">
        
        {/* OFFICIAL KOP SURAT DENGAN LOGO SMKN BOJONGGAMBIR */}
        <div className="flex items-center gap-4 border-b-4 border-double border-black pb-3 mb-6">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <img
              src={SMKN_LOGO_URL}
              alt="Logo SMKN Bojonggambir"
              className="w-20 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center flex-1">
            <div className="text-xs sm:text-sm font-bold tracking-wider uppercase">Pemerintah Daerah Provinsi Jawa Barat</div>
            <div className="text-xs sm:text-sm font-bold tracking-wider uppercase">Dinas Pendidikan</div>
            <div className="text-[11px] sm:text-xs font-semibold uppercase">Cabang Dinas Pendidikan Wilayah XII</div>
            <div className="text-lg sm:text-2xl font-extrabold tracking-wide uppercase mt-0.5 font-sans text-emerald-950">
              SMK NEGERI BOJONGGAMBIR
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-700 italic mt-0.5 font-sans">
              Program Keahlian: Desain Komunikasi Visual (DKV) & Agribisnis Pengolahan Hasil Pertanian (APHP)
            </div>
            <div className="text-[9px] sm:text-[10px] text-gray-600 font-sans">
              Jl. Raya Bojonggambir, Kec. Bojonggambir, Kab. Tasikmalaya, Jawa Barat 46475 • Email: smknbojonggambir@gmail.com
            </div>
          </div>
          <div className="w-20 h-20 shrink-0 hidden md:block opacity-0" />
        </div>

        {/* REPORT TITLE */}
        <div className="text-center mb-6">
          <h1 className="text-base sm:text-lg font-bold uppercase underline font-sans">
            LAPORAN REKAPITULASI AGENDA KELAS & BEBAN MENGAJAR GURU
          </h1>
          <div className="text-xs font-sans font-semibold text-gray-700 mt-1">
            KURIKULUM MERDEKA • TAHUN AJARAN 2025/2026
          </div>
          <div className="text-xs font-sans text-gray-600 mt-0.5">
            Periode: <strong>{getPeriodeLabel()}</strong>
          </div>
        </div>

        {/* METRICS SUMMARY ROW */}
        <div className="grid grid-cols-4 gap-3 mb-6 font-sans text-xs">
          <div className="border border-black p-2.5 rounded text-center bg-gray-50">
            <div className="text-[10px] text-gray-600 uppercase font-semibold">Total Jam Mengajar</div>
            <div className="text-base font-bold font-mono">{summary.totalJamMengajar} JP</div>
          </div>
          <div className="border border-black p-2.5 rounded text-center bg-gray-50">
            <div className="text-[10px] text-gray-600 uppercase font-semibold">Total Sesi Pertemuan</div>
            <div className="text-base font-bold font-mono">{summary.totalSesi} Sesi</div>
          </div>
          <div className="border border-black p-2.5 rounded text-center bg-gray-50">
            <div className="text-[10px] text-gray-600 uppercase font-semibold">Guru Melapor</div>
            <div className="text-base font-bold font-mono">{summary.guruBeban.length} Guru</div>
          </div>
          <div className="border border-black p-2.5 rounded text-center bg-gray-50">
            <div className="text-[10px] text-gray-600 uppercase font-semibold">Rerata Kehadiran Siswa</div>
            <div className="text-base font-bold font-mono">{summary.kehadiranRekap.persentaseKehadiran}%</div>
          </div>
        </div>

        {/* SECTION 1: TABEL BEBAN MENGAJAR GURU */}
        <div className="mb-6 font-sans">
          <h2 className="text-xs font-bold uppercase mb-2 border-b border-black pb-1">
            I. Rekapitulasi Beban Mengajar & Mata Pelajaran per Guru
          </h2>
          <table className="w-full text-[11px] border-collapse border border-black">
            <thead>
              <tr className="bg-gray-200 text-black font-bold text-center">
                <th className="border border-black p-1.5 w-8">No</th>
                <th className="border border-black p-1.5 text-left">Nama Guru</th>
                <th className="border border-black p-1.5 text-left">Mata Pelajaran yang Diajarkan</th>
                <th className="border border-black p-1.5 text-left">Kelas</th>
                <th className="border border-black p-1.5 w-16 text-center">Beban JP</th>
                <th className="border border-black p-1.5 w-12 text-center">Sesi</th>
                <th className="border border-black p-1.5 w-16 text-center">Formatif</th>
                <th className="border border-black p-1.5 w-16 text-center">Sumatif</th>
              </tr>
            </thead>
            <tbody>
              {summary.guruBeban.map((guru, idx) => (
                <tr key={guru.namaGuru} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                  <td className="border border-black p-1.5 font-bold">Bpk/Ibu {guru.namaGuru}</td>
                  <td className="border border-black p-1.5">{guru.daftarMapel.join(', ')}</td>
                  <td className="border border-black p-1.5">{guru.daftarKelas.join(', ')}</td>
                  <td className="border border-black p-1.5 text-center font-bold font-mono">{guru.totalJam} JP</td>
                  <td className="border border-black p-1.5 text-center font-mono">{guru.totalSesi}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{guru.asesmenFormatifCount}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{guru.asesmenSumatifCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 2: ASESMEN & MODEL PEMBELAJARAN */}
        <div className="grid grid-cols-2 gap-4 mb-6 font-sans text-xs">
          
          {/* Asesmen Breakdown */}
          <div className="border border-black p-3 rounded">
            <h3 className="font-bold uppercase text-[11px] mb-2 border-b border-gray-400 pb-1">
              II. Jenis Asesmen yang Digunakan
            </h3>
            
            <div className="space-y-2">
              <div>
                <strong className="text-[10px] text-gray-700 uppercase">A. Asesmen Formatif:</strong>
                <ul className="list-disc pl-4 text-[10px] text-gray-800">
                  {summary.formatifBreakdown.slice(0, 5).map((f) => (
                    <li key={f.jenis}>
                      {f.jenis}: <strong>{f.count} kali</strong> ({f.percentage}%)
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <strong className="text-[10px] text-gray-700 uppercase">B. Asesmen Sumatif:</strong>
                <ul className="list-disc pl-4 text-[10px] text-gray-800">
                  {summary.sumatifBreakdown.slice(0, 5).map((s) => (
                    <li key={s.jenis}>
                      {s.jenis}: <strong>{s.count} kali</strong> ({s.percentage}%)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Model Pembelajaran & Kehadiran */}
          <div className="border border-black p-3 rounded">
            <h3 className="font-bold uppercase text-[11px] mb-2 border-b border-gray-400 pb-1">
              III. Model Pembelajaran & Presensi
            </h3>

            <div className="space-y-2">
              <div>
                <strong className="text-[10px] text-gray-700 uppercase">Model / Metode:</strong>
                <ul className="list-disc pl-4 text-[10px] text-gray-800">
                  {summary.modelBreakdown.map((m) => (
                    <li key={m.model}>
                      {m.model}: <strong>{m.count} sesi</strong> ({m.percentage}%)
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-1 border-t border-gray-300 text-[10px]">
                <strong className="text-gray-700 uppercase">Rekap Kehadiran:</strong>
                <div className="mt-0.5">
                  Hadir: {summary.kehadiranRekap.totalHadir} | Sakit: {summary.kehadiranRekap.totalSakit} | Izin: {summary.kehadiranRekap.totalIzin} | Alfa: {summary.kehadiranRekap.totalAlfa}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* OFFICIAL SIGNATURE BLOCK */}
        <div className="pt-6 font-sans text-xs">
          <div className="flex justify-between items-end">
            
            {/* Left: Wakasek Kurikulum */}
            <div className="text-center w-64">
              <div>Mengetahui,</div>
              <div className="font-bold">Wakil Kepala Sekolah Bid. Kurikulum</div>
              <div className="h-20 flex items-center justify-center italic text-gray-400">
                (Tanda Tangan)
              </div>
              <div className="font-bold underline uppercase">{wakasekKurikulum}</div>
              <div className="text-[11px]">NIP. {nipWakasek}</div>
            </div>

            {/* Right: Kepala Sekolah */}
            <div className="text-center w-64">
              <div>Bojonggambir, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="font-bold">Kepala SMK Negeri Bojonggambir</div>
              <div className="h-20 flex items-center justify-center italic text-gray-400">
                (Tanda Tangan & Cap Sekolah)
              </div>
              <div className="font-bold underline uppercase">{kepalaSekolah}</div>
              <div className="text-[11px]">NIP. {nipKepsek}</div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
