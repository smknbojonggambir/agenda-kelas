import React, { useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { AgendaEntry } from '../types';
import { DAFTAR_GURU, DAFTAR_KELAS, SMKN_LOGO_URL } from '../constants/agendaData';

interface PrintAgendaDocProps {
  entries: AgendaEntry[];
  onBack: () => void;
}

export const PrintAgendaDoc: React.FC<PrintAgendaDocProps> = ({
  entries,
  onBack
}) => {
  const [filterGuru, setFilterGuru] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [kepalaSekolah, setKepalaSekolah] = useState('Drs. H. Sukmana, M.Pd.');
  const [nipKepsek, setNipKepsek] = useState('19680512 199403 1 008');

  const filteredEntries = entries.filter((item) => {
    const matchGuru = filterGuru === '' || item.namaGuru === filterGuru;
    const matchKelas = filterKelas === '' || item.kelas === filterKelas;
    return matchGuru && matchKelas;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Control Panel (Hidden during Print) */}
      <div className="bg-emerald-950/80 backdrop-blur-xl rounded-2xl p-5 md:p-6 silver-border no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <span>Format Cetak Jurnal Agenda Kelas Resmi</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Standar format Administrasi Pembelajaran SMKN Bojonggambir Kurikulum Merdeka.
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

        {/* Filter controls */}
        <div className="mt-4 pt-4 border-t border-slate-400/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Filter Guru Pengampu:</label>
            <select
              value={filterGuru}
              onChange={(e) => setFilterGuru(e.target.value)}
              className="w-full bg-emerald-950 border border-slate-400 text-white rounded-xl p-2 focus:ring-2 focus:ring-amber-400 outline-none"
            >
              <option value="">Semua Guru</option>
              {DAFTAR_GURU.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Filter Kelas:</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full bg-emerald-950 border border-slate-400 text-white rounded-xl p-2 focus:ring-2 focus:ring-amber-400 outline-none"
            >
              <option value="">Semua Kelas</option>
              {DAFTAR_KELAS.map((k) => (
                <option key={k.nama} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nama Kepala Sekolah / Penanggung Jawab:</label>
            <input
              type="text"
              value={kepalaSekolah}
              onChange={(e) => setKepalaSekolah(e.target.value)}
              className="w-full bg-emerald-950 border border-slate-400 text-white rounded-xl p-2 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Official Paper Layout (Rendered as White A4 Document) */}
      <div className="bg-white text-black p-8 md:p-12 rounded-xl shadow-2xl max-w-5xl mx-auto border border-slate-300 font-serif">
        
        {/* Kop Surat Resmi dengan Logo SMKN Bojonggambir */}
        <div className="flex items-center gap-4 border-b-4 border-double border-black pb-4 mb-6">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <img
              src={SMKN_LOGO_URL}
              alt="Logo SMKN Bojonggambir"
              className="w-20 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center flex-1">
            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase">
              PEMERINTAH DAERAH PROVINSI JAWA BARAT
            </h3>
            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase">
              DINAS PENDIDIKAN
            </h3>
            <h3 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase">
              CABANG DINAS PENDIDIKAN WILAYAH XII
            </h3>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-wide uppercase mt-0.5">
              SMK NEGERI BOJONGGAMBIR
            </h2>
            <p className="text-[10px] sm:text-[11px] font-sans text-slate-700 mt-0.5">
              Kompetensi Keahlian: Desain Komunikasi Visual (DKV) & Agribisnis Pengolahan Hasil Pertanian (APHP)
            </p>
            <p className="text-[9px] sm:text-[10px] font-sans text-slate-600">
              Jalan Raya Bojonggambir, Kec. Bojonggambir, Kab. Tasikmalaya, Jawa Barat 46475 • Email: smknbojonggambir@gmail.com
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 hidden md:block opacity-0" />
        </div>

        {/* Title of Document */}
        <div className="text-center mb-6">
          <h2 className="text-base md:text-lg font-bold underline uppercase">
            JURNAL AGENDA PEMBELAJARAN KELAS
          </h2>
          <p className="text-xs font-sans text-slate-700 font-medium">
            Tahun Ajaran 2026/2027 — Kurikulum Merdeka
          </p>
          {filterKelas && (
            <p className="text-xs font-sans font-bold text-emerald-900 mt-0.5">
              Kelas: {filterKelas} {filterGuru ? `| Guru: ${filterGuru}` : ''}
            </p>
          )}
        </div>

        {/* Table of Entries */}
        <div className="overflow-x-auto mb-8 font-sans">
          <table className="w-full text-left text-[11px] border border-black border-collapse">
            <thead>
              <tr className="bg-slate-100 text-black font-bold text-center border-b border-black">
                <th className="border border-black p-2 w-8">No</th>
                <th className="border border-black p-2 whitespace-nowrap">Hari / Tgl</th>
                <th className="border border-black p-2 w-16">Jam Ke</th>
                <th className="border border-black p-2">Guru Pengampu</th>
                <th className="border border-black p-2">Kelas</th>
                <th className="border border-black p-2">Mata Pelajaran</th>
                <th className="border border-black p-2 min-w-[180px]">Tujuan Pembelajaran (TP) & Materi</th>
                <th className="border border-black p-2">Model</th>
                <th className="border border-black p-2">Asesmen</th>
                <th className="border border-black p-2 w-14 text-center">Presensi (H/S/I/A)</th>
                <th className="border border-black p-2 w-16 text-center">Paraf</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-6 text-slate-500 italic border border-black">
                    Belum ada data agenda kelas yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, idx) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-black p-2 whitespace-nowrap">
                      <div className="font-semibold">{item.hari}</div>
                      <div className="text-[10px] text-slate-600">{item.tanggal}</div>
                    </td>
                    <td className="border border-black p-2 text-center text-[10px]">{item.jamKe}</td>
                    <td className="border border-black p-2 font-semibold">{item.namaGuru}</td>
                    <td className="border border-black p-2 font-bold">{item.kelas}</td>
                    <td className="border border-black p-2">{item.mataPelajaran}</td>
                    <td className="border border-black p-2 text-[10px] leading-tight">{item.tujuan}</td>
                    <td className="border border-black p-2 text-center font-bold">{item.modelMetode}</td>
                    <td className="border border-black p-2 text-[9px] leading-tight">
                      {item.asesmenFormatif.length > 0 && <div>F: {item.asesmenFormatif.join(',')}</div>}
                      {item.asesmenSumatif.length > 0 && <div>S: {item.asesmenSumatif.join(',')}</div>}
                    </td>
                    <td className="border border-black p-2 text-center text-[10px] whitespace-nowrap font-mono">
                      {item.kehadiran?.hadir ?? 0}/{item.kehadiran?.sakit ?? 0}/{item.kehadiran?.izin ?? 0}/{item.kehadiran?.alfa ?? 0}
                    </td>
                    <td className="border border-black p-2 text-center">
                      <div className="h-6"></div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Resmi */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-8 pt-4">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala SMKN Bojonggambir</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{kepalaSekolah}</p>
            <p className="text-[10px] text-slate-600">NIP. {nipKepsek}</p>
          </div>

          <div>
            <p>Bojonggambir, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru Pengampu Mata Pelajaran</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{filterGuru ? filterGuru : '( .................................................. )'}</p>
            <p className="text-[10px] text-slate-600">NIP. ....................................................</p>
          </div>
        </div>

      </div>

    </div>
  );
};
