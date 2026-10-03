# DigiWisata - Sistem Pencatatan Wisata Digital

Aplikasi Progressive Web App untuk pencatatan kunjungan wisata oleh petugas lapangan dan verifikasi laporan oleh Disporapar Kabupaten Serang.

## Alur DigiWisata Aktif

- Petugas mengirim nama objek, tanggal kunjungan, jumlah wisatawan lokal dan mancanegara, catatan, serta foto bukti opsional.
- Saat dashboard petugas dibuka, browser meminta izin lokasi. Koordinat disimpan pada laporan dan dikirim ke OpenStreetMap Nominatim untuk mencari kecamatan. Laporan tidak dapat dikirim sebelum GPS tersedia.
- Nama kecamatan hasil geocoding dapat tidak tersedia atau kurang tepat; koordinat tetap tersimpan sebagai lokasi yang dapat diperiksa.
- Admin menerima dan meninjau laporan. Laporan yang dikembalikan menampilkan alasan agar petugas dapat memperbaikinya dan mengirim ulang.
- Rekap bulanan/tahunan dapat difilter berdasarkan kecamatan, jenis wisata, status, atau nama objek dan diekspor sebagai CSV.
- Koordinat perangkat dikirim ke layanan publik OpenStreetMap Nominatim saat lookup kecamatan. Akses lokasi hanya diminta untuk akun PETUGAS; gunakan HTTPS.

## Fitur

- Input laporan kunjungan dengan jumlah wisatawan lokal dan mancanegara.
- Lokasi GPS, waktu pengambilan, dan kecamatan otomatis; nama kecamatan dapat perlu diverifikasi.
- Verifikasi admin, alasan perbaikan, dan pengiriman ulang laporan oleh petugas.
- Rekap bulanan/tahunan, filter laporan, ringkasan kecamatan, dan ekspor CSV.
- PWA responsif dengan autentikasi dan Row Level Security Supabase.

## Teknologi

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **PWA**: vite-plugin-pwa
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Persyaratan Sistem

- Node.js 18+ 
- npm atau yarn
- Akun Supabase (gratis)

## Instalasi

### 1. Clone Repository

```bash
cd DigiWisata
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

#### a. Buat Project Supabase

1. Kunjungi [https://supabase.com](https://supabase.com)
2. Sign up / Sign in
3. Buat project baru
4. Tunggu project selesai dibuat (± 2 menit)

#### b. Jalankan Migration Database

1. Buka Supabase Dashboard
2. Masuk ke menu **SQL Editor**
3. Jalankan `supabase/001_initial_schema.sql` terlebih dahulu.
4. Jalankan file `supabase/migrations/002_...sql` hingga `013_...sql` sesuai urutan nomor.
5. Untuk project yang sudah mencatat migration 013, jangan jalankan ulang seluruh file. Terapkan blok SQL DigiWisata tambahan di bagian akhir file melalui SQL Editor. Jika error PGRST205 tetap muncul, pastikan `VITE_SUPABASE_URL` menunjuk ke project yang sama dan tabel `public.tourism_reports` sudah ada.

#### c. Setup Authentication

1. Di Supabase Dashboard, masuk ke **Authentication** > **Providers**
2. Pastikan **Email** provider sudah enabled
3. (Opsional) Setup email template sesuai kebutuhan

#### d. Buat User Awal

1. Di Supabase Dashboard, masuk ke **Authentication** > **Users**
2. Klik **Add user**
3. Undang sepuluh petugas melalui **Authentication > Users**. Gunakan email unik yang dikonfirmasi kepada setiap petugas dan isi metadata `name` dengan nama pada SK.
4. Trigger migration 011 otomatis membuat profil `PETUGAS`; tidak perlu insert manual ke `public.users`.
5. Undang akun admin secara terpisah. Setelah trigger membuat profilnya sebagai `PETUGAS`, ubah role admin menjadi `ADMIN` melalui SQL Editor:

```sql
UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@contoh.go.id';
```

Daftar petugas sesuai SK:

1. Gian Nugraha
2. Beni Rahmat
3. Faeruzzabadi
4. Jaenal Abidin
5. Anita Sufi Adelia
6. Reska Permana Putra
7. Tania Ratih
8. A'la Rizkiyani Rahmadina
9. Nana Suharna
10. TB. Ainun Najib

Jangan memakai password bersama atau menyimpan password di source code. Akun petugas tidak dibuat lewat pendaftaran publik di aplikasi. Jika akun Beni yang sudah ada dipakai sebagai admin, pertahankan akun itu dan buat akun petugas terpisah dengan email yang dikonfirmasi kepada Beni.

#### e. Dapatkan API Keys

1. Di Supabase Dashboard, masuk ke **Project Settings** > **API**
2. Copy:
   - Project URL
   - anon public key

### 4. Setup Environment Variables

1. Copy file `.env.example`:
```bash
cp .env.example .env
```

2. Edit `.env` dan isi dengan nilai dari Supabase:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Build untuk Production

```bash
npm run build
```

File hasil build akan ada di folder `dist/`

## Preview Production Build

```bash
npm run preview
```

## Struktur Project

```
DigiWisata/
├── src/
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts (Auth, Theme)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Supabase client
│   ├── pages/          # Page components
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── supabase/           # Database migrations
├── public/             # Static assets
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## Penggunaan

- **Petugas:** masuk, izinkan lokasi perangkat, isi objek/tanggal/jumlah kunjungan, lalu kirim laporan. Laporan yang dikembalikan tampil dengan alasan dan dapat diperbaiki.
- **Admin:** buka laporan masuk, verifikasi atau minta perbaikan dengan alasan, lalu gunakan filter periode/zona dan ekspor CSV.

## Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project ke [Vercel](https://vercel.com)
3. Buka **Project Settings > Environment Variables** dan tambahkan untuk **Production**:
   - `VITE_SUPABASE_URL` (Project URL dari Supabase)
   - `VITE_SUPABASE_ANON_KEY` (anon public key dari Supabase)
4. Pastikan **Deployment Protection** tidak memblokir pengunjung publik
5. Deploy atau lakukan **Redeploy** setelah mengubah environment variables
6. Bagikan URL **Production**, bukan URL Preview

### Netlify

1. Build project: `npm run build`
2. Upload folder `dist/` ke Netlify
3. Setup environment variables di Netlify

### Self-Hosted

1. Build project: `npm run build`
2. Upload folder `dist/` ke hosting (cPanel, shared hosting, VPS)
3. Pastikan hosting support HTTPS (wajib untuk PWA)

## Role dan Akses

- `PETUGAS`: input laporan lapangan dan mengirim ulang laporan miliknya yang perlu diperbaiki.
- `ADMIN`: menerima, memverifikasi, merekap, mengekspor laporan, dan melihat audit log.

## Keamanan

- ✅ Authentication via Supabase Auth
- ✅ Role-based access control
- ✅ Row Level Security (RLS) di database
- ✅ Environment variables untuk sensitive data
- ✅ Audit log untuk aktivitas penting

## Catatan Lokasi

Permintaan GPS hanya muncul untuk akun `PETUGAS`. Koordinat dikirim ke OpenStreetMap Nominatim untuk mencari kecamatan; hasil kecamatan dapat kosong atau kurang tepat, sedangkan koordinat tetap tersimpan. Gunakan HTTPS di deployment.

### Backup Data
Disarankan untuk:
1. Export data dari Supabase secara berkala
2. Simpan di lokasi yang aman
3. Gunakan fitur backup Supabase

## Troubleshooting

### Login Gagal
- Pastikan user sudah dibuat di Supabase Auth
- Pastikan user sudah di-insert ke tabel `users`
- Cek email dan password

### Data Tidak Muncul
- Pastikan migration database sudah dijalankan
- Cek RLS policies di Supabase
- Pastikan user memiliki role yang sesuai

### PWA Tidak Bisa Di-install
- Pastikan aplikasi diakses via HTTPS
- Pastikan service worker terdaftar dengan benar
- Clear cache browser dan coba lagi

## Dukungan

Untuk pertanyaan atau masalah:
- Beni Rahmat (Petugas pendataan wisata)
- Disporapar Kabupaten Serang

## Lisensi

Aplikasi ini mendukung pencatatan dan pelaporan kunjungan wisata Disporapar Kabupaten Serang.

---

DigiWisata · Disporapar Kabupaten Serang
