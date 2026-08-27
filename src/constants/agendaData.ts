export const SMKN_LOGO_URL = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgz1tbb8TSawO2lHGi_GXN3Il5CtrN_K125hSy7D8NxvBFL6bywiebvkalj_6oRIBVxEm_zj84j6ZAlhKmaEOqjIeGHXe9SWw0HQipKs3aL8iy7K1Dc_Pd9SHMVZsOQrb99qTK78Wmee7StIKKzzfST5YU_CkGSAz3MuMJsrSL_nHt37c5AzIe8B7HodnQ/s320/LOGO%20SMKN%20BOJONGGAMBIR.png';

export const DAFTAR_GURU = [
  'Dini',
  'Seni',
  'Wahab',
  'Iman',
  'Ihsan',
  'Darus',
  'Itang',
  'Yogi',
  'Aa Mansur',
  'Giardi',
  'Ratih',
  'Rangga',
  'Ridwan',
  'Ruli',
  'Sutisna',
  'Ilfan',
  'Dede Adi',
  'Rian',
  'Ali'
];

export const DAFTAR_JURUSAN = [
  { kode: 'DKV', nama: 'Desain Komunikasi Visual', color: 'from-amber-600 to-amber-700' },
  { kode: 'APHP', nama: 'Agribisnis Pengolahan Hasil Pertanian', color: 'from-emerald-700 to-emerald-800' }
];

export const DAFTAR_KELAS = [
  { nama: 'X DKV 1', jurusan: 'DKV', tingkat: 'X' },
  { nama: 'X DKV 2', jurusan: 'DKV', tingkat: 'X' },
  { nama: 'X APHP', jurusan: 'APHP', tingkat: 'X' },
  { nama: 'XI DKV 1', jurusan: 'DKV', tingkat: 'XI' },
  { nama: 'XI DKV 2', jurusan: 'DKV', tingkat: 'XI' },
  { nama: 'XI APHP', jurusan: 'APHP', tingkat: 'XI' },
  { nama: 'XII DKV 1', jurusan: 'DKV', tingkat: 'XII' },
  { nama: 'XII DKV 2', jurusan: 'DKV', tingkat: 'XII' },
  { nama: 'XII DKV 3', jurusan: 'DKV', tingkat: 'XII' },
  { nama: 'XII APHP', jurusan: 'APHP', tingkat: 'XII' }
];

export interface MataPelajaranItem {
  nama: string;
  kategori: 'Kejuruan DKV' | 'Kejuruan APHP' | 'Umum' | 'Muatan Lokal / P5';
  jurusanTerkait?: 'DKV' | 'APHP' | 'Semua';
}

export const DAFTAR_MAPEL: MataPelajaranItem[] = [
  // Kejuruan DKV
  { nama: 'Dasar-dasar Kejuruan DKV', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  { nama: 'Desain Grafis Percetakan & Tipografi', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  { nama: 'Ilustrasi Digital & Vektor', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  { nama: 'Fotografi & Videografi Komersial', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  { nama: 'Animasi 2D & 3D', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  { nama: 'Desain Publikasi & Branding', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  { nama: 'Desain UI/UX & Web Media Interaktif', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  { nama: 'Produk Kreatif & Kewirausahaan (PKK) DKV', kategori: 'Kejuruan DKV', jurusanTerkait: 'DKV' },
  
  // Kejuruan APHP
  { nama: 'Dasar-dasar Kejuruan APHP', kategori: 'Kejuruan APHP', jurusanTerkait: 'APHP' },
  { nama: 'Produksi Pengolahan Hasil Nabati', kategori: 'Kejuruan APHP', jurusanTerkait: 'APHP' },
  { nama: 'Produksi Pengolahan Hasil Hewani', kategori: 'Kejuruan APHP', jurusanTerkait: 'APHP' },
  { nama: 'Pengolahan Hasil Perkebunan & Herbal', kategori: 'Kejuruan APHP', jurusanTerkait: 'APHP' },
  { nama: 'Pengawasan Mutu & Keamanan Pangan (HACCP)', kategori: 'Kejuruan APHP', jurusanTerkait: 'APHP' },
  { nama: 'Pengemasan, Penyimpanan, & Penggudangan', kategori: 'Kejuruan APHP', jurusanTerkait: 'APHP' },
  { nama: 'Produk Kreatif & Kewirausahaan (PKK) APHP', kategori: 'Kejuruan APHP', jurusanTerkait: 'APHP' },
  
  // Mata Pelajaran Umum Kurikulum Merdeka
  { nama: 'Pendidikan Agama Islam & Budi Pekerti', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Pendidikan Pancasila', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Bahasa Indonesia', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Sejarah Indonesia', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Seni Budaya', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Bahasa Inggris', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Matematika', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Informatika', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Projek IPAS (Ilmu Pengetahuan Alam & Sosial)', kategori: 'Umum', jurusanTerkait: 'Semua' },
  { nama: 'Bimbingan Konseling (BK)', kategori: 'Umum', jurusanTerkait: 'Semua' },

  // Muatan Lokal / P5
  { nama: 'Bahasa & Sastra Sunda (Muatan Lokal)', kategori: 'Muatan Lokal / P5', jurusanTerkait: 'Semua' },
  { nama: 'Projek Penguatan Profil Pelajar Pancasila (P5)', kategori: 'Muatan Lokal / P5', jurusanTerkait: 'Semua' }
];

export const DAFTAR_JAM_KE = [
  'Jam ke-1 (07.00 - 07.45)',
  'Jam ke-2 (07.45 - 08.30)',
  'Jam ke-3 (08.30 - 09.15)',
  'Jam ke-4 (09.30 - 10.15)',
  'Jam ke-5 (10.15 - 11.00)',
  'Jam ke-6 (11.00 - 11.45)',
  'Jam ke-7 (12.30 - 13.15)',
  'Jam ke-8 (13.15 - 14.00)',
  'Jam ke-9 (14.00 - 14.45)',
  'Jam ke-10 (14.45 - 15.30)',
  'Jam 1 s/d 2',
  'Jam 1 s/d 3',
  'Jam 1 s/d 4',
  'Jam 3 s/d 4',
  'Jam 4 s/d 6',
  'Jam 5 s/d 6',
  'Jam 7 s/d 8',
  'Jam 7 s/d 9',
  'Jam 7 s/d 10',
  'Jam 9 s/d 10'
];

export const DAFTAR_MODEL_METODE = [
  { kode: 'PJBL', nama: 'Project Based Learning (PJBL)', desc: 'Pembelajaran berbasis proyek riil/produk karya siswa' },
  { kode: 'PBL', nama: 'Problem Based Learning (PBL)', desc: 'Pembelajaran berbasis pemecahan masalah kontekstual' },
  { kode: 'DL', nama: 'Discovery Learning (DL)', desc: 'Pembelajaran penemuan konsep mandiri & terbimbing' },
  { kode: 'INQUIRY', nama: 'Inquiry Learning', desc: 'Pembelajaran berbasis investigasi & penyelidikan ilmiah' },
  { kode: 'SETS', nama: 'Science, Environment, Technology, Society (SETS)', desc: 'Keterkaitan sains, lingkungan, teknologi & masyarakat' },
  { kode: 'DTBL', nama: 'Design Thinking Based Learning (DTBL)', desc: 'Pembelajaran berbasis empati, ideasi & perancangan prototipe' },
  { kode: 'STEAM', nama: 'STEAM (Science, Tech, Eng, Art, Math)', desc: 'Pendekatan terpadu sains, teknologi, rekayasa, seni & matematika' }
];

export const OPSI_ASESMEN_FORMATIF = [
  'Pretes',
  'Post Tes',
  'Quiz',
  'Tanya',
  'Jawab',
  'Pertanyaan Pemantik',
  'Penilaian Antarteman',
  'Observasi Sikap / Keaktifan',
  'Refleksi Diri'
];

export const OPSI_ASESMEN_SUMATIF = [
  'Portofolio',
  'Projek',
  'Observasi Produk',
  'Perform',
  'Praktik',
  'Lisan',
  'Tes Tertulis / Teori'
];

export const CONTOH_TEMPLATE_TUJUAN = [
  'Peserta didik mampu memahami konsep dasar dan menerapkan langkah kerja secara terstruktur dan mandiri.',
  'Peserta didik mampu merancang karya visual/produk olahan pangan sesuai prosedur K3LH dan standar industri.',
  'Peserta didik dapat menganalisis permasalahan kontekstual dan menyajikan solusi pemecahan masalah secara kolaboratif.',
  'Peserta didik mampu mengevaluasi hasil pengujian produk dan menyusun laporan unjuk kerja dengan teliti dan jujur.',
  'Peserta didik mampu mengoperasikan peralatan praktik kejuruan sesuai SOP dengan memperhatikan efisiensi dan keamanan.'
];
