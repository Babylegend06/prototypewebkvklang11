# 📝 Sistem Penjana PDF Rancangan Pengajaran (SVM)

Sistem web berasaskan cloud untuk menjana borang **Lampiran 2b (Rancangan Pengajaran)** secara automatik. Dibina menggunakan HTML/JS, di-hosting di **Netlify**, dan menggunakan **Google Sheets & Drive** sebagai backend.

## 🚀 Ciri-Ciri Utama
- **Antaramuka Mirip PDF:** UI borang disusun mengikut format rasmi Lampiran 2b.
- **Dropdown Dinamik:** Mengambil senarai nama guru dan kod kursus dari Google Sheets secara berasingan.
- **Auto-Generate PDF:** Menghasilkan fail PDF terus ke Google Drive.
- **Dashboard:** Melihat rekod hantaran dan butang download fail yang telah siap.

## 🛠️ Persediaan Google Sheets
Sediakan satu fail Google Sheets dengan tab berikut:
1. `Guru`: Simpan senarai nama guru.
2. `Kursus`: Simpan kod dan nama kursus.
3. `Modul`: Simpan standard kandungan mengikut kursus.
4. `Rekod`: Untuk menyimpan pautan fail yang dijana.

## 📂 Struktur Fail Projek
- `index.html`: Borang input utama (UI).
- `dashboard.html`: Halaman pemantauan dan download PDF.
- `style.css`: Styling profesional mengikut format borang rasmi.
- `script.js`: Logik penghantaran data (Fetch API) ke Google Apps Script.

## ⚙️ Cara Pemasangan
1. **GitHub:** Push semua fail ke repository anda.
2. **Netlify:** Connect repository dan pilih branch `main`.
3. **Google Apps Script:** - Cipta skrip baru di `script.google.com`.
   - Gunakan kod `doPost(e)` untuk proses data.
   - Deploy sebagai "Web App" dan set akses kepada "Anyone".
4. **Environment Variables:** Masukkan URL Web App Google anda ke dalam `script.js`.

## 📄 Rujukan Dokumen
Sistem ini mematuhi format:
- **[span_6](start_span)Jabatan:** Pendidikan Umum[span_6](end_span)
- **[span_7](start_span)Kod Kursus:** Sejarah (SVM)[span_7](end_span)
- **[span_8](start_span)Standard Kandungan:** 2.1 Era Peralihan Kuasa British[span_8](end_span)
