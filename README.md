# Agenda Kelas SMKN Bojonggambir

Aplikasi Jurnal dan Agenda Pembelajaran Kelas berbasis Web untuk **SMKN Bojonggambir** (Konsentrasi Keahlian DKV & APHP). Terintegrasi dengan Google Apps Script (`Code.gs`) dan Google Sheets untuk pencatatan otomatis, laporan analisis beban mengajar mingguan (Recharts), rekap kehadiran, notifikasi jadwal, dan ekspor format cetak resmi.

## 🚀 Fitur Utama

- **Input Agenda Pembelajaran**: Formulir pencatatan agenda harian lengkap dengan validasi guru, rombel DKV & APHP, model pembelajaran (PJBL, PBL, Discovery Learning, STEAM), asesmen, dan catatan kejadian kelas.
- **Sinkronisasi Google Sheets & Webhook**: Terhubung langsung dengan Google Apps Script untuk pencadangan otomatis ke spreadsheet.
- **Rekap Jurnal Interaktif**: Tabel data agenda kelas dengan pencarian *real-time*, filter cepat, paginasi, dan ekspor/impor JSON backup.
- **Laporan & Analitik Visual (Recharts)**:
  - Grafik tren jam mengajar (JP) mingguan.
  - Perbandingan beban mengajar per konsentrasi keahlian (DKV vs APHP).
  - Distribusi model pembelajaran dan tingkat kehadiran siswa.
- **Pengingat & Notifikasi Jadwal**: Alarm pengingat jadwal mengajar aktif dengan audio chime dan web notification.
- **Format Cetak Dokumen Resmi**: Template cetak dokumen jurnal agenda dan laporan rekapitulasi siap cetak (A4 / F4).
- **Shortcut Keyboard**: Navigasi cepat menggunakan `Ctrl+1` hingga `Ctrl+6`, `Ctrl+K`, dan `Alt+T` (ganti tema Gelap/Terang).

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Visualisasi**: Recharts, Lucide React, Motion (Framer Motion)
- **Integrasi**: Google Apps Script (Code.gs), Webhook Google Sheets

## 📦 Menjalankan di Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/smknbojonggambir/agenda-kelas.git
   cd agenda-kelas
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```

## 🌐 Deploy ke GitHub Pages (Opsional)

Jika ingin mempublikasikan aplikasi melalui GitHub Pages:

1. Di `vite.config.ts`, tambahkan `base: '/agenda-kelas/'`.
2. Jalankan `npm run build`.
3. Deploy folder `dist` menggunakan GitHub Actions atau branch `gh-pages`.

---
© SMKN Bojonggambir - Tasikmalaya
