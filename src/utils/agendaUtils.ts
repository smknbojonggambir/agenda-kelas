import { AgendaEntry, ReportFilter, ReportSummaryData, TeacherWorkload } from '../types';

/**
 * Maps jamKe string to estimated hours and start/end time
 */
export interface JamSlotInfo {
  jamCount: number;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export function parseJamKe(jamKe: string): JamSlotInfo {
  const clean = jamKe.trim();

  // Pattern: "Jam 1 s/d 3" or "1 s/d 3"
  const rangeMatch = clean.match(/Jam\s*(\d+)\s*s\/d\s*(\d+)/i) || clean.match(/(\d+)\s*s\/d\s*(\d+)/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    const count = Math.max(1, end - start + 1);
    return {
      jamCount: count,
      startTime: getStartTimeForPeriod(start),
      endTime: getEndTimeForPeriod(end)
    };
  }

  // Single period: "Jam ke-1 (07.00 - 07.45)"
  const singleMatch = clean.match(/Jam\s*(?:ke-)?\s*(\d+)/i) || clean.match(/^(\d+)$/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    return {
      jamCount: 1,
      startTime: getStartTimeForPeriod(num),
      endTime: getEndTimeForPeriod(num)
    };
  }

  // Fallback defaults
  return {
    jamCount: 2,
    startTime: '07:00',
    endTime: '08:30'
  };
}

export function getStartTimeForPeriod(period: number): string {
  const schedule: Record<number, string> = {
    1: '07:00',
    2: '07:45',
    3: '08:30',
    4: '09:30',
    5: '10:15',
    6: '11:00',
    7: '12:30',
    8: '13:15',
    9: '14:00',
    10: '14:45'
  };
  return schedule[period] || '07:00';
}

export function getEndTimeForPeriod(period: number): string {
  const schedule: Record<number, string> = {
    1: '07:45',
    2: '08:30',
    3: '09:15',
    4: '10:15',
    5: '11:00',
    6: '11:45',
    7: '13:15',
    8: '14:00',
    9: '14:45',
    10: '15:30'
  };
  return schedule[period] || '08:30';
}

/**
 * Plays a pleasant classroom bell chime using Web Audio API
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell sequence: F5 -> A5 -> C6 -> F6
    const frequencies = [698.46, 880.0, 1046.5, 1396.91];
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);

      gain.gain.setValueAtTime(0.001, now + index * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.15 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.9);
    });
  } catch (e) {
    console.warn('Audio chime playback not supported or user interacted yet:', e);
  }
}

/**
 * Filter entries based on ReportFilter criteria
 */
export function filterAgendaEntries(entries: AgendaEntry[], filter: ReportFilter): AgendaEntry[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  return entries.filter((entry) => {
    // Filter by Guru
    if (filter.selectedGuru && filter.selectedGuru !== 'Semua' && entry.namaGuru !== filter.selectedGuru) {
      return false;
    }

    // Filter by Jurusan
    if (filter.selectedJurusan && filter.selectedJurusan !== 'Semua' && entry.jurusan !== filter.selectedJurusan) {
      return false;
    }

    // Filter by Kelas
    if (filter.selectedKelas && filter.selectedKelas !== 'Semua' && entry.kelas !== filter.selectedKelas) {
      return false;
    }

    // Filter by Period
    const entryDate = entry.tanggal || (entry.timestamp ? entry.timestamp.split('T')[0] : '');

    if (filter.period === 'today') {
      return entryDate === todayStr;
    }

    if (filter.period === 'this_week') {
      const entryTime = new Date(entryDate).getTime();
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return entryTime >= sevenDaysAgo;
    }

    if (filter.period === 'this_month') {
      const entryD = new Date(entryDate);
      return entryD.getFullYear() === now.getFullYear() && entryD.getMonth() === now.getMonth();
    }

    if (filter.period === 'custom') {
      if (filter.startDate && entryDate < filter.startDate) return false;
      if (filter.endDate && entryDate > filter.endDate) return false;
      return true;
    }

    return true; // 'all'
  });
}

/**
 * Generates comprehensive analytics summary from agenda entries
 */
export function calculateReportSummary(entries: AgendaEntry[]): ReportSummaryData {
  let totalJamMengajar = 0;
  const guruMap: Record<string, TeacherWorkload> = {};
  const mapelMap: Record<string, { totalJam: number; sesi: number; jurusan: string }> = {};
  const kelasMap: Record<string, { totalJam: number; sesi: number }> = {};
  const modelCount: Record<string, number> = {};
  const formatifCount: Record<string, number> = {};
  const sumatifCount: Record<string, number> = {};

  let totalHadir = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalAlfa = 0;

  entries.forEach((entry) => {
    const slotInfo = parseJamKe(entry.jamKe);
    const jam = slotInfo.jamCount;
    totalJamMengajar += jam;

    // Guru workload
    const guru = entry.namaGuru || 'Tidak Ditentukan';
    if (!guruMap[guru]) {
      guruMap[guru] = {
        namaGuru: guru,
        totalJam: 0,
        totalSesi: 0,
        daftarMapel: [],
        daftarKelas: [],
        modelDigunakan: {},
        asesmenFormatifCount: 0,
        asesmenSumatifCount: 0
      };
    }
    guruMap[guru].totalJam += jam;
    guruMap[guru].totalSesi += 1;
    if (entry.mataPelajaran && !guruMap[guru].daftarMapel.includes(entry.mataPelajaran)) {
      guruMap[guru].daftarMapel.push(entry.mataPelajaran);
    }
    if (entry.kelas && !guruMap[guru].daftarKelas.includes(entry.kelas)) {
      guruMap[guru].daftarKelas.push(entry.kelas);
    }
    if (entry.modelMetode) {
      guruMap[guru].modelDigunakan[entry.modelMetode] = (guruMap[guru].modelDigunakan[entry.modelMetode] || 0) + 1;
    }
    if (Array.isArray(entry.asesmenFormatif)) {
      guruMap[guru].asesmenFormatifCount += entry.asesmenFormatif.length;
    }
    if (Array.isArray(entry.asesmenSumatif)) {
      guruMap[guru].asesmenSumatifCount += entry.asesmenSumatif.length;
    }

    // Mapel breakdown
    const mapel = entry.mataPelajaran || 'Lainnya';
    if (!mapelMap[mapel]) {
      mapelMap[mapel] = { totalJam: 0, sesi: 0, jurusan: entry.jurusan || 'Umum' };
    }
    mapelMap[mapel].totalJam += jam;
    mapelMap[mapel].sesi += 1;

    // Kelas breakdown
    const kelas = entry.kelas || 'Lainnya';
    if (!kelasMap[kelas]) {
      kelasMap[kelas] = { totalJam: 0, sesi: 0 };
    }
    kelasMap[kelas].totalJam += jam;
    kelasMap[kelas].sesi += 1;

    // Model Pembelajaran
    if (entry.modelMetode) {
      modelCount[entry.modelMetode] = (modelCount[entry.modelMetode] || 0) + 1;
    }

    // Asesmen Formatif
    if (Array.isArray(entry.asesmenFormatif)) {
      entry.asesmenFormatif.forEach((f) => {
        formatifCount[f] = (formatifCount[f] || 0) + 1;
      });
    }

    // Asesmen Sumatif
    if (Array.isArray(entry.asesmenSumatif)) {
      entry.asesmenSumatif.forEach((s) => {
        sumatifCount[s] = (sumatifCount[s] || 0) + 1;
      });
    }

    // Kehadiran
    if (entry.kehadiran) {
      totalHadir += Number(entry.kehadiran.hadir) || 0;
      totalSakit += Number(entry.kehadiran.sakit) || 0;
      totalIzin += Number(entry.kehadiran.izin) || 0;
      totalAlfa += Number(entry.kehadiran.alfa) || 0;
    }
  });

  const totalSesi = entries.length;
  const rataRataJamPerSesi = totalSesi > 0 ? parseFloat((totalJamMengajar / totalSesi).toFixed(1)) : 0;

  // Convert to sorted lists
  const guruBeban = Object.values(guruMap).sort((a, b) => b.totalJam - a.totalJam);

  const mapelBreakdown = Object.entries(mapelMap)
    .map(([mapel, data]) => ({
      mapel,
      totalJam: data.totalJam,
      sesi: data.sesi,
      jurusan: data.jurusan
    }))
    .sort((a, b) => b.totalJam - a.totalJam);

  const kelasBreakdown = Object.entries(kelasMap)
    .map(([kelas, data]) => ({
      kelas,
      totalJam: data.totalJam,
      sesi: data.sesi
    }))
    .sort((a, b) => b.totalJam - a.totalJam);

  const totalModelSessions = Object.values(modelCount).reduce((acc, curr) => acc + curr, 0) || 1;
  const modelBreakdown = Object.entries(modelCount)
    .map(([model, count]) => ({
      model,
      count,
      percentage: Math.round((count / totalModelSessions) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const totalFormatif = Object.values(formatifCount).reduce((acc, curr) => acc + curr, 0) || 1;
  const formatifBreakdown = Object.entries(formatifCount)
    .map(([jenis, count]) => ({
      jenis,
      count,
      percentage: Math.round((count / totalFormatif) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const totalSumatif = Object.values(sumatifCount).reduce((acc, curr) => acc + curr, 0) || 1;
  const sumatifBreakdown = Object.entries(sumatifCount)
    .map(([jenis, count]) => ({
      jenis,
      count,
      percentage: Math.round((count / totalSumatif) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const totalSiswa = totalHadir + totalSakit + totalIzin + totalAlfa;
  const persentaseKehadiran = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 100;

  return {
    totalSesi,
    totalJamMengajar,
    rataRataJamPerSesi,
    guruBeban,
    mapelBreakdown,
    kelasBreakdown,
    modelBreakdown,
    formatifBreakdown,
    sumatifBreakdown,
    kehadiranRekap: {
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlfa,
      totalSiswa,
      persentaseKehadiran
    }
  };
}
