export const SCRIPT_CODE_GS = `/**
 * =========================================================================
 * AGENDA KELAS - SMK NEGERI BOJONGGAMBIR (KURIKULUM MERDEKA)
 * Backend Script Google Apps Script (Code.gs) - Versi 2.0 (Lengkap Notifikasi & Laporan)
 * =========================================================================
 * Fitur:
 * 1. Menerima & menyimpan data agenda kelas via HTTP POST (doPost)
 * 2. Menu Kustom Google Spreadsheet untuk membuat Laporan Otomatis (Mingguan/Bulanan)
 * 3. Fungsi Pengingat Jadwal Mengajar Harian otomatis ke Email Guru (Time-driven Trigger)
 * 4. Pembuat Laporan Rekapitulasi Beban Mengajar Guru & Asesmen ke Sheet baru
 */

var SHEET_NAME = "AGENDA_KELAS_SMKN_BOJONGGAMBIR";
var SHEET_REKAP = "REKAP_LAPORAN_PEMBELAJARAN";

/**
 * Event onOpen: Menambahkan Menu Khusus di Google Spreadsheet
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏫 SMKN Bojonggambir')
    .addItem('📊 Buat Laporan Rekapitulasi Pembelajaran', 'menuBuatLaporan')
    .addItem('🔔 Pasang Pengingat Jadwal Otomatis (06.30 WIB)', 'pasangTriggerPengingatHarian')
    .addItem('📧 Kirim Rekap Jadwal Hari Ini ke Email Guru', 'kirimPengingatJadwalOtomatis')
    .addToUi();
}

/**
 * Fungsi GET: Melayani antarmuka Web App & API pembacaan
 */
function doGet(e) {
  if (!e.parameter.action) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('AGENDA KELAS - SMK Negeri Bojonggambir')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (e.parameter.action === 'report') {
    return ContentService.createTextOutput(JSON.stringify(hitungRekapitulasiData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter.action === 'read') {
    return ContentService.createTextOutput(JSON.stringify(bacaSemuaData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "ready", school: "SMK Negeri Bojonggambir" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fungsi POST: Menerima data kiriman dari Form Agenda Kelas
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      inisialisasiHeader(sheet);
    }

    var data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }

    var timestamp = new Date();
    var hari = data.hari || getHariIndonesia(timestamp);
    var tanggal = data.tanggal || Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyy-MM-dd");
    var jamKe = data.jamKe || "-";
    var namaGuru = data.namaGuru || "-";
    var jurusan = data.jurusan || "-";
    var kelas = data.kelas || "-";
    var mataPelajaran = data.mataPelajaran || "-";
    var tujuan = data.tujuan || "-";
    var modelMetode = data.modelMetode || "-";
    var formatif = Array.isArray(data.asesmenFormatif) ? data.asesmenFormatif.join(", ") : (data.asesmenFormatif || "-");
    var sumatif = Array.isArray(data.asesmenSumatif) ? data.asesmenSumatif.join(", ") : (data.asesmenSumatif || "-");
    
    var hadir = (data.kehadiran && data.kehadiran.hadir !== undefined) ? data.kehadiran.hadir : (data.hadir || 0);
    var sakit = (data.kehadiran && data.kehadiran.sakit !== undefined) ? data.kehadiran.sakit : (data.sakit || 0);
    var izin = (data.kehadiran && data.kehadiran.izin !== undefined) ? data.kehadiran.izin : (data.izin || 0);
    var alfa = (data.kehadiran && data.kehadiran.alfa !== undefined) ? data.kehadiran.alfa : (data.alfa || 0);
    var catatan = data.catatanKejadian || (data.kehadiran && data.kehadiran.catatan) || "-";

    var rowData = [
      Utilities.formatDate(timestamp, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss"),
      hari, tanggal, jamKe, namaGuru, jurusan, kelas, mataPelajaran,
      tujuan, modelMetode, formatif, sumatif, hadir, sakit, izin, alfa, catatan
    ];

    sheet.appendRow(rowData);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, rowData.length).setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      message: "Data Agenda Kelas tersimpan ke Spreadsheet!",
      row: lastRow,
      timestamp: rowData[0]
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * =========================================================================
 * FITUR 1: NOTIFIKASI & PENGINGAT JADWAL MENGAJAR GURU
 * =========================================================================
 */

/**
 * Pasang Time-driven Trigger harian pukul 06.30 WIB otomatis
 */
function pasangTriggerPengingatHarian() {
  // Hapus trigger lama agar tidak duplikat
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'kirimPengingatJadwalOtomatis') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Buat trigger baru setiap hari pukul 06:00 - 07:00
  ScriptApp.newTrigger('kirimPengingatJadwalOtomatis')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  SpreadsheetApp.getUi().alert('Sukses!', 'Trigger notifikasi pengingat jadwal mengajar harian (06.30 WIB) berhasil diaktifkan.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Kirim email pengingat jadwal mengajar hari ini
 */
function kirimPengingatJadwalOtomatis() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  var jadwalHariIni = [];
  for (var i = 1; i < data.length; i++) {
    var tglRow = Utilities.formatDate(new Date(data[i][2]), "Asia/Jakarta", "yyyy-MM-dd");
    if (tglRow === todayStr) {
      jadwalHariIni.push({
        jamKe: data[i][3],
        guru: data[i][4],
        kelas: data[i][6],
        mapel: data[i][7],
        tujuan: data[i][8]
      });
    }
  }

  if (jadwalHariIni.length === 0) return;

  var userEmail = Session.getActiveUser().getEmail();
  if (!userEmail) return;

  var subject = "🔔 Pengingat Jadwal Mengajar SMKN Bojonggambir - " + todayStr;
  var body = "Yth. Bapak/Ibu Guru SMKN Bojonggambir,\\n\\nBerikut adalah jadwal agenda mengajar hari ini:\\n\\n";

  for (var k = 0; k < jadwalHariIni.length; k++) {
    body += (k + 1) + ". [" + jadwalHariIni[k].jamKe + "] " + jadwalHariIni[k].guru + " - " + jadwalHariIni[k].kelas + "\\n" +
            "   Mata Pelajaran: " + jadwalHariIni[k].mapel + "\\n" +
            "   Materi/TP: " + jadwalHariIni[k].tujuan + "\\n\\n";
  }

  body += "Semangat mencerdaskan generasi SMK Negeri Bojonggambir!\\nSalam Kurikulum Merdeka.";
  MailApp.sendEmail(userEmail, subject, body);
}

/**
 * =========================================================================
 * FITUR 2: PELAPORAN & REKAPITULASI PEMBELAJARAN
 * =========================================================================
 */

function menuBuatLaporan() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Buat Laporan Rekapitulasi', 'Apakah Anda ingin membuat sheet rekapitulasi beban mengajar guru, mata pelajaran, dan asesmen secara otomatis?', ui.ButtonSet.YES_NO);
  if (response === ui.Button.YES) {
    buatSheetLaporanRekapitulasi();
    ui.alert('Sukses!', 'Sheet "' + SHEET_REKAP + '" berhasil dibuat dan diperbarui!', ui.ButtonSet.OK);
  }
}

/**
 * Membuat sheet rekapitulasi terstruktur di Google Spreadsheet
 */
function buatSheetLaporanRekapitulasi() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRekap = ss.getSheetByName(SHEET_REKAP);
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet(SHEET_REKAP);
  } else {
    sheetRekap.clear();
  }

  var sheetData = ss.getSheetByName(SHEET_NAME);
  if (!sheetData) return;

  var data = sheetData.getDataRange().getValues();
  if (data.length <= 1) return;

  // Header Laporan
  sheetRekap.getRange("A1").setValue("LAPORAN REKAPITULASI AGENDA KELAS & BEBAN MENGAJAR GURU");
  sheetRekap.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#064E3B");
  sheetRekap.getRange("A2").setValue("SMK NEGERI BOJONGGAMBIR • KURIKULUM MERDEKA");
  sheetRekap.getRange("A2").setFontSize(11).setFontWeight("bold");
  sheetRekap.getRange("A3").setValue("Dicetak Tanggal: " + Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMMM yyyy HH:mm") + " WIB");
  sheetRekap.getRange("A3").setFontStyle("italic").setFontColor("#64748B");

  var tableHeaders = [
    "No", "Nama Guru", "Total Sesi", "Mata Pelajaran yang Diajar", "Kelas yang Diampu",
    "Model Pembelajaran Dominan", "Asesmen Formatif Digunakan", "Asesmen Sumatif Digunakan"
  ];
  sheetRekap.getRange(5, 1, 1, tableHeaders.length).setValues([tableHeaders]);
  var headerRange = sheetRekap.getRange(5, 1, 1, tableHeaders.length);
  headerRange.setBackground("#064E3B").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");

  // Agregasi Data per Guru
  var guruMap = {};
  for (var i = 1; i < data.length; i++) {
    var guru = data[i][4] || "Tanpa Nama";
    var mapel = data[i][7] || "-";
    var kelas = data[i][6] || "-";
    var model = data[i][9] || "-";
    var formatif = data[i][10] || "-";
    var sumatif = data[i][11] || "-";

    if (!guruMap[guru]) {
      guruMap[guru] = { sesi: 0, mapel: {}, kelas: {}, model: {}, formatif: {}, sumatif: {} };
    }
    guruMap[guru].sesi += 1;
    guruMap[guru].mapel[mapel] = true;
    guruMap[guru].kelas[kelas] = true;
    guruMap[guru].model[model] = (guruMap[guru].model[model] || 0) + 1;
    guruMap[guru].formatif[formatif] = true;
    guruMap[guru].sumatif[sumatif] = true;
  }

  var rowIdx = 6;
  var no = 1;
  for (var g in guruMap) {
    var mapelList = Object.keys(guruMap[g].mapel).join(", ");
    var kelasList = Object.keys(guruMap[g].kelas).join(", ");
    var modelList = Object.keys(guruMap[g].model).join(", ");
    var formatifList = Object.keys(guruMap[g].formatif).join("; ");
    var sumatifList = Object.keys(guruMap[g].sumatif).join("; ");

    sheetRekap.getRange(rowIdx, 1, 1, tableHeaders.length).setValues([[
      no, g, guruMap[g].sesi, mapelList, kelasList, modelList, formatifList, sumatifList
    ]]);
    rowIdx++;
    no++;
  }

  // Border & Format
  sheetRekap.getRange(5, 1, rowIdx - 5, tableHeaders.length).setBorder(true, true, true, true, true, true, '#94a3b8', SpreadsheetApp.BorderStyle.SOLID);
  sheetRekap.autoResizeColumns(1, tableHeaders.length);
}

function hitungRekapitulasiData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return { totalEntries: 0 };
  var data = sheet.getDataRange().getValues();
  return { totalEntries: Math.max(0, data.length - 1) };
}

function inisialisasiHeader(sheet) {
  var headers = [
    "Timestamp", "Hari", "Tanggal", "Jam Ke", "Nama Guru", "Jurusan", "Kelas",
    "Mata Pelajaran", "Tujuan Pembelajaran (TP)", "Model / Metode",
    "Asesmen Formatif", "Asesmen Sumatif", "Hadir", "Sakit", "Izin", "Alfa", "Catatan Kejadian / Refleksi"
  ];
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#064E3B");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);
}

function getHariIndonesia(date) {
  var hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hariArray[date.getDay()];
}

function simpanDataDariHtml(formData) {
  return doPost({ postData: { contents: JSON.stringify(formData) } });
}

function bacaSemuaData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = data[i][j];
    }
    rows.push(item);
  }
  return rows;
}
`;

export const SCRIPT_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AGENDA KELAS - SMK Negeri Bojonggambir</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(circle at top, #064e3b 0%, #022c22 45%, #051c14 100%);
      min-height: 100vh;
      color: #f1f5f9;
    }
    .font-brand { font-family: 'Cinzel', serif; }
    .silver-border {
      border: 1px solid #cbd5e1;
      box-shadow: 0 10px 25px -5px rgba(234, 179, 8, 0.25), 0 4px 6px -2px rgba(203, 213, 225, 0.2);
    }
  </style>
</head>
<body class="p-3 md:p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    
    <!-- Header -->
    <header class="bg-emerald-900/90 rounded-2xl p-6 silver-border text-center">
      <div class="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-400/40 mb-2">
        KURIKULUM MERDEKA
      </div>
      <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-wide font-brand">
        AGENDA KELAS & NOTIFIKASI
      </h1>
      <p class="text-emerald-200 text-sm md:text-base font-medium mt-1">
        SMK NEGERI BOJONGGAMBIR
      </p>
    </header>

    <!-- Reminder Banner & Sound Tester -->
    <div class="bg-emerald-950/90 rounded-2xl p-4 silver-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2">
        <span class="p-2 rounded-lg bg-amber-500/20 text-amber-300 font-bold">🔔 Pengingat:</span>
        <span class="text-slate-200">Notifikasi jadwal kelas aktif sebelum jam pelajaran dimulai.</span>
      </div>
      <button onclick="bunyikanBelSekolah()" class="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-400/40 cursor-pointer">
        ▶ Tes Bel Kelas
      </button>
    </div>

    <!-- Main Form -->
    <main class="bg-slate-900/90 rounded-2xl p-6 md:p-8 silver-border">
      <form id="agendaForm" onsubmit="submitForm(event)" class="space-y-5">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-emerald-200 mb-1">1. Hari</label>
            <select id="hari" class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
              <option value="Senin">Senin</option>
              <option value="Selasa">Selasa</option>
              <option value="Rabu">Rabu</option>
              <option value="Kamis">Kamis</option>
              <option value="Jumat">Jumat</option>
              <option value="Sabtu">Sabtu</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-emerald-200 mb-1">Tanggal</label>
            <input type="date" id="tanggal" required class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-emerald-200 mb-1">2. Jam ke (1 - 10)</label>
          <select id="jamKe" class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
            <option value="Jam ke-1 (07.00 - 07.45)">Jam ke-1 (07.00 - 07.45)</option>
            <option value="Jam ke-2 (07.45 - 08.30)">Jam ke-2 (07.45 - 08.30)</option>
            <option value="Jam ke-3 (08.30 - 09.15)">Jam ke-3 (08.30 - 09.15)</option>
            <option value="Jam ke-4 (09.30 - 10.15)">Jam ke-4 (09.30 - 10.15)</option>
            <option value="Jam ke-5 (10.15 - 11.00)">Jam ke-5 (10.15 - 11.00)</option>
            <option value="Jam ke-6 (11.00 - 11.45)">Jam ke-6 (11.00 - 11.45)</option>
            <option value="Jam ke-7 (12.30 - 13.15)">Jam ke-7 (12.30 - 13.15)</option>
            <option value="Jam ke-8 (13.15 - 14.00)">Jam ke-8 (13.15 - 14.00)</option>
            <option value="Jam ke-9 (14.00 - 14.45)">Jam ke-9 (14.00 - 14.45)</option>
            <option value="Jam ke-10 (14.45 - 15.30)">Jam ke-10 (14.45 - 15.30)</option>
            <option value="Jam 1 s/d 3">Jam 1 s/d 3</option>
            <option value="Jam 4 s/d 6">Jam 4 s/d 6</option>
            <option value="Jam 7 s/d 9">Jam 7 s/d 9</option>
            <option value="Jam 7 s/d 10">Jam 7 s/d 10</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-emerald-200 mb-1">3. Nama Guru</label>
          <select id="namaGuru" required class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
            <option value="">-- Pilih Guru --</option>
            <option value="Dini">Dini</option>
            <option value="Seni">Seni</option>
            <option value="Wahab">Wahab</option>
            <option value="Iman">Iman</option>
            <option value="Ihsan">Ihsan</option>
            <option value="Darus">Darus</option>
            <option value="Itang">Itang</option>
            <option value="Yogi">Yogi</option>
            <option value="Aa Mansur">Aa Mansur</option>
            <option value="Giardi">Giardi</option>
            <option value="Ratih">Ratih</option>
            <option value="Rangga">Rangga</option>
            <option value="Ridwan">Ridwan</option>
            <option value="Ruli">Ruli</option>
            <option value="Sutisna">Sutisna</option>
            <option value="Ilfan">Ilfan</option>
            <option value="Dede Adi">Dede Adi</option>
            <option value="Rian">Rian</option>
            <option value="Ali">Ali</option>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-emerald-200 mb-1">4. Jurusan</label>
            <select id="jurusan" class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
              <option value="DKV">DKV (Desain Komunikasi Visual)</option>
              <option value="APHP">APHP (Agribisnis Pengolahan Hasil Pertanian)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-emerald-200 mb-1">Kelas</label>
            <select id="kelas" required class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
              <option value="X DKV 1">X DKV 1</option>
              <option value="X DKV 2">X DKV 2</option>
              <option value="X APHP">X APHP</option>
              <option value="XI DKV 1">XI DKV 1</option>
              <option value="XI DKV 2">XI DKV 2</option>
              <option value="XI APHP">XI APHP</option>
              <option value="XII DKV 1">XII DKV 1</option>
              <option value="XII DKV 2">XII DKV 2</option>
              <option value="XII DKV 3">XII DKV 3</option>
              <option value="XII APHP">XII APHP</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-emerald-200 mb-1">5. Mata Pelajaran</label>
          <select id="mataPelajaran" required class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
            <optgroup label="-- Kejuruan DKV --">
              <option value="Dasar-dasar Kejuruan DKV">Dasar-dasar Kejuruan DKV</option>
              <option value="Desain Grafis Percetakan & Tipografi">Desain Grafis Percetakan & Tipografi</option>
              <option value="Ilustrasi Digital & Vektor">Ilustrasi Digital & Vektor</option>
              <option value="Fotografi & Videografi Komersial">Fotografi & Videografi Komersial</option>
              <option value="Animasi 2D & 3D">Animasi 2D & 3D</option>
              <option value="Desain Publikasi & Branding">Desain Publikasi & Branding</option>
              <option value="Desain UI/UX & Web Media Interaktif">Desain UI/UX & Web Media Interaktif</option>
              <option value="Produk Kreatif & Kewirausahaan (PKK) DKV">Produk Kreatif & Kewirausahaan (PKK) DKV</option>
            </optgroup>
            <optgroup label="-- Kejuruan APHP --">
              <option value="Dasar-dasar Kejuruan APHP">Dasar-dasar Kejuruan APHP</option>
              <option value="Produksi Pengolahan Hasil Nabati">Produksi Pengolahan Hasil Nabati</option>
              <option value="Produksi Pengolahan Hasil Hewani">Produksi Pengolahan Hasil Hewani</option>
              <option value="Pengolahan Hasil Perkebunan & Herbal">Pengolahan Hasil Perkebunan & Herbal</option>
              <option value="Pengawasan Mutu & Keamanan Pangan (HACCP)">Pengawasan Mutu & Keamanan Pangan (HACCP)</option>
              <option value="Pengemasan, Penyimpanan, & Penggudangan">Pengemasan, Penyimpanan, & Penggudangan</option>
              <option value="Produk Kreatif & Kewirausahaan (PKK) APHP">Produk Kreatif & Kewirausahaan (PKK) APHP</option>
            </optgroup>
            <optgroup label="-- Mata Pelajaran Umum & Muatan Lokal --">
              <option value="Pendidikan Agama Islam & Budi Pekerti">Pendidikan Agama Islam & Budi Pekerti</option>
              <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)">Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)</option>
              <option value="Sejarah Indonesia">Sejarah Indonesia</option>
              <option value="Seni Budaya">Seni Budaya</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
              <option value="Matematika">Matematika</option>
              <option value="Informatika">Informatika</option>
              <option value="Projek IPAS">Projek IPAS</option>
              <option value="Bahasa & Sastra Sunda (Muatan Lokal)">Bahasa & Sastra Sunda (Muatan Lokal)</option>
              <option value="Projek Penguatan Profil Pelajar Pancasila (P5)">Projek Penguatan Profil Pelajar Pancasila (P5)</option>
              <option value="Bimbingan Konseling (BK)">Bimbingan Konseling (BK)</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-emerald-200 mb-1">6. TUJUAN (Tujuan Pembelajaran / TP)</label>
          <textarea id="tujuan" rows="3" required placeholder="Tuliskan Tujuan Pembelajaran (TP) yang dipelajari..." class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none"></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-emerald-200 mb-1">7. MODEL ATAU METODE</label>
          <select id="modelMetode" class="w-full bg-emerald-950/80 border border-slate-400 text-white rounded-lg p-2.5 text-xs outline-none">
            <option value="PJBL">PJBL (Project Based Learning)</option>
            <option value="PBL">PBL (Problem Based Learning)</option>
            <option value="DL">DL (Discovery Learning)</option>
            <option value="INQUIRY">INQUIRY (Inquiry Learning)</option>
            <option value="SETS">SETS (Science, Environment, Technology, Society)</option>
            <option value="DTBL">DTBL (Design Thinking Based Learning)</option>
            <option value="STEAM">STEAM (Science, Tech, Eng, Art, Math)</option>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-3 bg-emerald-950/40 rounded-xl border border-slate-500/50">
            <label class="block text-xs font-bold text-amber-300 mb-2">8a. ASESMEN Formatif</label>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-200">
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="formatif" value="Pretes" class="accent-amber-500"> <span>Pretes</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="formatif" value="Post Tes" class="accent-amber-500"> <span>Post Tes</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="formatif" value="Quiz" class="accent-amber-500"> <span>Quiz</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="formatif" value="Tanya" class="accent-amber-500"> <span>Tanya</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="formatif" value="Jawab" class="accent-amber-500"> <span>Jawab</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="formatif" value="Observasi Sikap" class="accent-amber-500"> <span>Observasi</span></label>
            </div>
          </div>
          <div class="p-3 bg-emerald-950/40 rounded-xl border border-slate-500/50">
            <label class="block text-xs font-bold text-amber-300 mb-2">8b. ASESMEN Sumatif</label>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-200">
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="sumatif" value="Portofolio" class="accent-amber-500"> <span>Portofolio</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="sumatif" value="Projek" class="accent-amber-500"> <span>Projek</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="sumatif" value="Observasi Produk" class="accent-amber-500"> <span>Obs. Produk</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="sumatif" value="Perform" class="accent-amber-500"> <span>Perform</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="sumatif" value="Praktik" class="accent-amber-500"> <span>Praktik</span></label>
              <label class="flex items-center space-x-1.5"><input type="checkbox" name="sumatif" value="Lisan" class="accent-amber-500"> <span>Lisan</span></label>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button type="submit" id="btnSubmit" class="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 text-white font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all silver-border">
            SIMPAN KE AGENDA & SPREADSHEET
          </button>
        </div>

        <div id="statusAlert" class="hidden p-3 rounded-lg text-xs text-center font-semibold"></div>
      </form>
    </main>
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
    });

    function bunyikanBelSekolah() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const freqs = [698.46, 880.0, 1046.5, 1396.91];
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.15);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.8);
        });
      } catch (e) {
        alert("Bel berbunyi!");
      }
    }

    function submitForm(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSubmit');
      const statusAlert = document.getElementById('statusAlert');
      btn.disabled = true;
      btn.innerHTML = "Menyimpan...";

      const formatif = [];
      document.querySelectorAll('input[name="formatif"]:checked').forEach(c => formatif.push(c.value));
      const sumatif = [];
      document.querySelectorAll('input[name="sumatif"]:checked').forEach(c => sumatif.push(c.value));

      const payload = {
        hari: document.getElementById('hari').value,
        tanggal: document.getElementById('tanggal').value,
        jamKe: document.getElementById('jamKe').value,
        namaGuru: document.getElementById('namaGuru').value,
        jurusan: document.getElementById('jurusan').value,
        kelas: document.getElementById('kelas').value,
        mataPelajaran: document.getElementById('mataPelajaran').value,
        tujuan: document.getElementById('tujuan').value,
        modelMetode: document.getElementById('modelMetode').value,
        asesmenFormatif: formatif,
        asesmenSumatif: sumatif
      };

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function() {
            btn.disabled = false;
            btn.innerHTML = "SIMPAN KE AGENDA & SPREADSHEET";
            statusAlert.className = "p-3 rounded-lg text-xs text-center font-semibold bg-emerald-800 text-emerald-100 border border-emerald-400 block";
            statusAlert.innerHTML = "Berhasil! Data Agenda Kelas tersimpan ke Spreadsheet.";
            document.getElementById('tujuan').value = "";
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerHTML = "SIMPAN KE AGENDA & SPREADSHEET";
            statusAlert.className = "p-3 rounded-lg text-xs text-center font-semibold bg-rose-900 text-rose-100 border border-rose-400 block";
            statusAlert.innerHTML = "Gagal: " + err;
          })
          .simpanDataDariHtml(payload);
      }
    }
  </script>
</body>
</html>
`;

export const PANDUAN_APPS_SCRIPT_STEPS = [
  {
    nomor: 1,
    judul: 'Buka Google Spreadsheet Baru',
    deskripsi: 'Buka Google Drive atau ketik sheets.new di browser. Beri judul Spreadsheet: "AGENDA KELAS SMKN BOJONGGAMBIR".'
  },
  {
    nomor: 2,
    judul: 'Buka Menu Apps Script',
    deskripsi: 'Di Google Spreadsheet, klik menu atas: Ekstensi (Extensions) > Apps Script.'
  },
  {
    nomor: 3,
    judul: 'Salin Kode Code.gs (Versi 2.0)',
    deskripsi: 'Hapus kode default di file Code.gs, lalu Salin & Tempel seluruh kode Code.gs yang telah disediakan di tab sebelah (sudah termasuk fungsi Notifikasi Email & Generator Laporan Otomatis).'
  },
  {
    nomor: 4,
    judul: 'Deploy Sebagai Web App',
    deskripsi: 'Klik tombol biru "Terapkan" (Deploy) di kanan atas > Pilih "Deployment Baru" (New Deployment) > Pilih Jenis "Aplikasi Web" (Web App).'
  },
  {
    nomor: 5,
    judul: 'Atur Hak Akses Web App',
    deskripsi: 'Isi Deskripsi: "Agenda Kelas SMKN Bojonggambir", Jalankan sebagai: "Saya" (Me), Siapa yang memiliki akses: "Siapa saja" (Anyone). Lalu klik Terapkan & Berikan Izin Akun Google.'
  },
  {
    nomor: 6,
    judul: 'Salin URL Web App ke Aplikasi Ini',
    deskripsi: 'Salin Web App URL yang dihasilkan (https://script.google.com/macros/s/...) dan tempelkan ke kolom URL Webhook di aplikasi ini.'
  },
  {
    nomor: 7,
    judul: 'Gunakan Menu "SMKN Bojonggambir" di Spreadsheet',
    deskripsi: 'Setelah di-refresh, akan muncul menu baru di Google Sheets bernama "🏫 SMKN Bojonggambir" untuk mengaktifkan Notifikasi Pengingat Jam 06.30 WIB dan Membuat Sheet Laporan Rekapitulasi secara instan!'
  }
];
