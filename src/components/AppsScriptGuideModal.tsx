import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SCRIPT_CODE_GS, SCRIPT_INDEX_HTML, PANDUAN_APPS_SCRIPT_STEPS } from '../constants/appsScriptCode';
import { AppsScriptConfig, ThemeMode } from '../types';

interface AppsScriptGuideProps {
  config: AppsScriptConfig;
  onSaveConfig: (config: AppsScriptConfig) => void;
  theme?: ThemeMode;
}

export const AppsScriptGuideModal: React.FC<AppsScriptGuideProps> = ({
  config,
  onSaveConfig,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  const [activeCodeTab, setActiveCodeTab] = useState<'codegs' | 'indexhtml' | 'panduan'>('codegs');
  const [copiedCodeGs, setCopiedCodeGs] = useState(false);
  const [copiedIndexHtml, setCopiedIndexHtml] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(config.webAppUrl || '');
  const [sheetName, setSheetName] = useState(config.sheetName || 'AGENDA_KELAS_SMKN_BOJONGGAMBIR');
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const copyToClipboard = (text: string, type: 'codegs' | 'indexhtml') => {
    navigator.clipboard.writeText(text);
    if (type === 'codegs') {
      setCopiedCodeGs(true);
      setTimeout(() => setCopiedCodeGs(false), 2500);
    } else {
      setCopiedIndexHtml(true);
      setTimeout(() => setCopiedIndexHtml(false), 2500);
    }
  };

  const handleSaveConfig = () => {
    onSaveConfig({
      ...config,
      webAppUrl: webhookUrl.trim(),
      sheetName: sheetName.trim() || 'AGENDA_KELAS_SMKN_BOJONGGAMBIR'
    });
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Mohon masukkan URL Google Apps Script Web App terlebih dahulu.'
      });
      return;
    }

    setTestStatus({ loading: true, message: 'Mengirim data uji coba ke Google Apps Script...' });

    const samplePayload = {
      hari: 'Senin',
      tanggal: new Date().toISOString().split('T')[0],
      jamKe: 'Jam ke-1 (07.00 - 07.45)',
      namaGuru: 'Ruli',
      jurusan: 'DKV',
      kelas: 'X DKV 1',
      mataPelajaran: 'Dasar-dasar Kejuruan DKV',
      tujuan: 'Uji koneksi Webhook Google Apps Script Agenda Kelas SMKN Bojonggambir',
      modelMetode: 'PJBL',
      asesmenFormatif: ['Tanya', 'Jawab', 'Quiz'],
      asesmenSumatif: ['Projek', 'Portofolio'],
      kehadiran: { hadir: 35, sakit: 0, izin: 0, alfa: 0 },
      catatanKejadian: 'Uji coba transmisi data otomatis berhasil.'
    };

    try {
      // POST to Apps Script Web App
      await fetch(webhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(samplePayload)
      });

      handleSaveConfig();

      setTestStatus({
        loading: false,
        success: true,
        message: 'Sinyal berhasil dikirim ke Google Apps Script! Silakan periksa Google Spreadsheet Anda untuk melihat baris baru yang tercatat otomatis.'
      });
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Gagal menghubungi Web App: ' + (err.message || 'Periksa kembali URL Web App Anda.')
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Banner */}
      <div
        className={`rounded-2xl p-6 transition-all ${
          isLight
            ? 'bg-white border border-slate-200 shadow-lg shadow-slate-200/50'
            : 'bg-slate-900/90 border border-slate-800 shadow-xl'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Petunjuk Teknis Google Apps Script (Code.gs & index.html)</span>
            </div>
            <h2 className={`text-xl md:text-2xl font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Integrasi Google Apps Script & Spreadsheet
            </h2>
            <p className={`text-xs md:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Panduan lengkap deploy skrip backend dan menghubungkan formulir Agenda Kelas langsung ke Google Spreadsheet SMKN Bojonggambir.
            </p>
          </div>

          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>Buka Google Spreadsheet Baru</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* URL Webhook Configuration Box */}
        <div
          className={`mt-6 p-4 rounded-xl border ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-800' : 'text-amber-300'}`}>
            URL Google Apps Script Web App (Webhook)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-mono outline-none transition-all ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                  : 'bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400'
              }`}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveConfig}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                Simpan URL
              </button>
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testStatus.loading}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testStatus.loading ? 'Menguji...' : 'Uji Kirim Data'}</span>
              </button>
            </div>
          </div>

          {/* Test Status feedback */}
          {testStatus.message && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs font-medium flex items-start gap-2 border ${
                testStatus.success
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-emerald-950 text-emerald-200 border-emerald-500'
                  : isLight
                  ? 'bg-rose-50 text-rose-900 border-rose-300'
                  : 'bg-rose-950 text-rose-200 border-rose-500'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Code Viewer & Steps Tabs */}
      <div
        className={`rounded-2xl overflow-hidden border ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}
      >
        {/* Navigation for Code tabs */}
        <div
          className={`p-3 flex items-center justify-between flex-wrap gap-2 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('codegs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCodeTab === 'codegs'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : isLight
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>1. Script Code.gs (Backend)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('indexhtml')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCodeTab === 'indexhtml'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : isLight
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>2. Script index.html (Web App)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('panduan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCodeTab === 'panduan'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : isLight
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>3. Langkah Deploy Spreadsheet</span>
            </button>
          </div>

          {/* Copy button */}
          {activeCodeTab === 'codegs' && (
            <button
              onClick={() => copyToClipboard(SCRIPT_CODE_GS, 'codegs')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {copiedCodeGs ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Seluruh Code.gs</span>
                </>
              )}
            </button>
          )}

          {activeCodeTab === 'indexhtml' && (
            <button
              onClick={() => copyToClipboard(SCRIPT_INDEX_HTML, 'indexhtml')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {copiedIndexHtml ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Seluruh index.html</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab 1: Code.gs */}
        {activeCodeTab === 'codegs' && (
          <div className="p-4 md:p-6">
            <div className={`mb-3 text-xs flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>File: <strong className={isLight ? 'text-emerald-800' : 'text-amber-300'}>Code.gs</strong> (Google Apps Script)</span>
              <span>Bahasa: JavaScript / Apps Script API</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[500px] custom-scrollbar">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre leading-relaxed">
                {SCRIPT_CODE_GS}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: index.html */}
        {activeCodeTab === 'indexhtml' && (
          <div className="p-4 md:p-6">
            <div className={`mb-3 text-xs flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>File: <strong className={isLight ? 'text-emerald-800' : 'text-amber-300'}>index.html</strong> (Apps Script Web Interface)</span>
              <span>Bahasa: HTML5 / Tailwind CSS</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[500px] custom-scrollbar">
              <pre className="font-mono text-xs text-amber-300 whitespace-pre leading-relaxed">
                {SCRIPT_INDEX_HTML}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Step by Step Guide */}
        {activeCodeTab === 'panduan' && (
          <div className="p-4 md:p-6 space-y-4">
            <h3 className={`text-base font-bold mb-2 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Petunjuk Langkah-demi-Langkah Pemasangan di Google Spreadsheet</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PANDUAN_APPS_SCRIPT_STEPS.map((step) => (
                <div
                  key={step.nomor}
                  className={`p-4 rounded-xl border transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                      {step.nomor}
                    </span>
                    <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {step.judul}
                    </h4>
                  </div>
                  <p className={`text-xs leading-relaxed pl-10 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {step.deskripsi}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <strong className={isLight ? 'text-amber-900 font-bold' : 'text-amber-300'}>
                Tips Penting Guru SMKN Bojonggambir:
              </strong>
              <p className="mt-1">
                Saat pertama kali menjalankan skrip di Apps Script, Google akan meminta izin keamanan ("Authorization Required").
                Klik <em>Review Permissions</em> &gt; Pilih akun Google Anda (guru.smk.belajar.id) &gt; Klik <em>Advanced</em> &gt; Klik <em>Go to AGENDA KELAS (unsafe)</em> &gt; Klik <em>Allow</em>. Hal ini 100% aman karena skrip berada di akun Google Drive pribadi sekolah Anda.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
