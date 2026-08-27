export type ThemeMode = 'light' | 'dark';

export interface BackupPayload {
  version: string;
  exportedAt: string;
  appName: string;
  schoolName: string;
  totalEntries: number;
  entries: AgendaEntry[];
  appsScriptConfig?: AppsScriptConfig;
  notificationSettings?: NotificationSettings;
}

export interface AgendaEntry {
  id: string;
  timestamp: string; // ISO string
  hari: string; // Senin, Selasa, etc.
  tanggal: string; // YYYY-MM-DD
  jamKe: string; // e.g. "1 - 3" or "1, 2" or "4"
  namaGuru: string;
  jurusan: 'APHP' | 'DKV' | string;
  kelas: string;
  mataPelajaran: string;
  kategoriMapel?: string;
  tujuan: string;
  modelMetode: string; // PJBL, PBL, DL, INQUIRY, SETS, DTBL, STEAM
  asesmenFormatif: string[]; // Pretes, Post Tes, Quiz, Tanya, Jawab, dll
  asesmenSumatif: string[]; // Portofolio, Projek, Observasi Produk, Perform, Praktik, Lisan
  kehadiran?: {
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    catatan?: string;
  };
  catatanKejadian?: string;
  statusKirim?: 'Tersimpan Lokal' | 'Terkirim ke Spreadsheet' | 'Gagal Kirim';
}

export interface AppsScriptConfig {
  webAppUrl: string;
  spreadsheetId?: string;
  sheetName: string;
  isAutoSync: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  selectedGuru: string; // 'Semua' or specific teacher name
  leadTimeMinutes: number; // 5, 10, 15, 30
  soundEnabled: boolean;
  browserPushEnabled: boolean;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string; // "06:30"
  emailNotificationEnabled: boolean;
  emailTarget: string;
}

export interface NotificationAlert {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  guru: string;
  kelas: string;
  jamKe: string;
  mataPelajaran: string;
  scheduledTime: string;
  status: 'upcoming' | 'ongoing' | 'passed';
  read: boolean;
}

export interface ReportFilter {
  period: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate: string;
  endDate: string;
  selectedGuru: string;
  selectedJurusan: string;
  selectedKelas: string;
}

export interface TeacherWorkload {
  namaGuru: string;
  totalJam: number;
  totalSesi: number;
  daftarMapel: string[];
  daftarKelas: string[];
  modelDigunakan: Record<string, number>;
  asesmenFormatifCount: number;
  asesmenSumatifCount: number;
}

export interface ReportSummaryData {
  totalSesi: number;
  totalJamMengajar: number;
  rataRataJamPerSesi: number;
  guruBeban: TeacherWorkload[];
  mapelBreakdown: { mapel: string; totalJam: number; sesi: number; jurusan: string }[];
  kelasBreakdown: { kelas: string; totalJam: number; sesi: number }[];
  modelBreakdown: { model: string; count: number; percentage: number }[];
  formatifBreakdown: { jenis: string; count: number; percentage: number }[];
  sumatifBreakdown: { jenis: string; count: number; percentage: number }[];
  kehadiranRekap: {
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlfa: number;
    totalSiswa: number;
    persentaseKehadiran: number;
  };
}
