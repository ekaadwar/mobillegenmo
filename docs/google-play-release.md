# Persiapan Rilis Google Play

## Status Pemeriksaan (11 November 2026)

| Bagian | Hasil |
| --- | --- |
| Nama pada perangkat | `ekamoto`; konfirmasi penulisan merek sebelum publikasi. |
| Application ID | `com.ekadeve.ekamoto`; jangan diubah jika aplikasi sudah terdaftar dengan ID ini. |
| Versi awal | `versionCode=1`, `versionName=1.0`; harus disesuaikan jika kode 1 pernah diupload. |
| SDK | Minimum 24, target 36, compile 37. Target 36 sesuai persyaratan submission saat pemeriksaan. |
| Arsitektur | Termasuk `arm64-v8a` untuk dukungan 64-bit. |
| Signing | Empat properti upload key belum tersedia pada lingkungan pemeriksaan; AAB bertanda tangan belum dibuat. |
| Jaringan | Endpoint lokal yang diperiksa memakai HTTPS dan bukan localhost; ketersediaan backend belum diuji. Rilis menolak cleartext HTTP. |
| Izin | Manifest utama hanya meminta INTERNET; izin gabungan dari dependency tetap perlu diperiksa pada artefak akhir. |
| Data | Login, token sesi melalui Keychain, data katalog, dan upload foto. Pernyataan Data safety perlu dikonfirmasi terhadap backend. |
| Native 16 KB | Belum diverifikasi pada artefak rilis/perangkat; jangan menganggap versi React Native saja menjamin kompatibilitas. |
| Pemeriksaan kode | TypeScript lulus; 160 tes pada 7 suite lulus pada pemeriksaan persiapan rilis. Setelah deklarasi tidak terpakai dihapus dari AppBadge, lint lulus dengan 0 error dan 4 warning. |
| Alur build | Dry-run `bundleRelease` berhasil dan menyertakan `validatePlayRelease` sebelum `preReleaseBuild`; kompilasi/signing penuh belum dijalankan. |

Persiapan ini tidak mengupload atau mempublikasikan aplikasi. Jangan mengirim password, keystore, atau kredensial Play Console melalui chat atau commit.

## 1. Siapkan Upload Key

Jika aplikasi sudah memiliki upload key, gunakan key tersebut. Jangan membuat pengganti sebelum memeriksa sertifikat upload pada Play Console. Upload key berbeda dari app signing key yang dapat dikelola Google melalui Play App Signing.

Untuk aplikasi baru, jalankan sendiri di terminal:

```sh
mkdir -p "$HOME/.android/keystores"
keytool -genkeypair -v -storetype PKCS12 \
  -keystore "$HOME/.android/keystores/ekamoto-upload.keystore" \
  -alias ekamoto-upload -keyalg RSA -keysize 2048 -validity 10000
```

Masukkan password langsung pada prompt terminal. Untuk PKCS12, gunakan password key yang sama dengan password store. Simpan backup terenkripsi beserta alias dan password di tempat terpisah. Jangan gunakan debug keystore.

Tambahkan properti berikut ke `~/.gradle/gradle.properties`, bukan berkas Gradle di repository. Ganti seluruh placeholder secara lokal; gunakan path absolut untuk keystore:

```properties
EKAMOTO_UPLOAD_STORE_FILE=/home/USER/.android/keystores/ekamoto-upload.keystore
EKAMOTO_UPLOAD_STORE_PASSWORD=ISI_SECARA_LOKAL
EKAMOTO_UPLOAD_KEY_ALIAS=ekamoto-upload
EKAMOTO_UPLOAD_KEY_PASSWORD=ISI_SECARA_LOKAL
```

```sh
chmod 600 "$HOME/.gradle/gradle.properties"
npm run android:release:check
```

Pemeriksaan tersebut memvalidasi kelengkapan properti, keberadaan berkas, dan penolakan debug key, bukan kebenaran password atau sertifikat. Gradle memeriksa password saat signing. Hindari parameter password pada command line dan jangan membagikan log verbose signing.

## 2. Konfirmasi Konfigurasi Produksi

- Isi `API_BASE_URL` pada `.env` dengan URL HTTPS backend produksi beserta path API yang benar. Berkas ini diabaikan Git; contoh nama variabel ada pada `.env.example`.
- `react-native-dotenv` menyisipkan nilai saat bundling. Jangan menaruh secret server pada `.env`: nilai yang dibundel dapat dibaca dari aplikasi.
- Pastikan tidak ada override `.env.production` atau `.env.local` yang menunjuk staging/lokal. Build rilis tidak membutuhkan Metro atau `adb reverse` saat digunakan.
- Pastikan URL foto dari backend juga HTTPS, sertifikat valid, dan endpoint dapat diakses dari internet tanpa jaringan developer.
- Konfirmasi application ID, nama aplikasi, ikon launcher, kepemilikan merek, dan versi. Versi npm bukan versi Android.
- Untuk update, `EKAMOTO_VERSION_CODE` harus lebih tinggi dari seluruh kode yang pernah diupload. Jangan mengubah application ID atau mengganti upload key tanpa prosedur Play Console.

## 3. Uji Dan Buat AAB

Prasyarat: dependency npm terpasang, JDK 17, Android SDK Platform 37, Build Tools 37.0.0, dan NDK 27.1.12297006 sesuai konfigurasi proyek. Gunakan lockfile yang dikelola proyek jika tersedia.

Jalankan dari root repository:

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm run android:release:check
npm run android:bundle
```

Contoh versi eksplisit dari root, untuk update berikutnya jika kode 2 belum digunakan:

```sh
./android/gradlew -p android :app:bundleRelease \
  -PEKAMOTO_VERSION_CODE=2 -PEKAMOTO_VERSION_NAME=1.0.1 --console=plain
```

Artefak untuk Play Console: `android/app/build/outputs/bundle/release/app-release.aab`.

Verifikasi signature bundle dan catat checksum:

```sh
jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab
sha256sum android/app/build/outputs/bundle/release/app-release.aab
```

Gunakan `keytool -list -v -keystore "$HOME/.android/keystores/ekamoto-upload.keystore" -alias ekamoto-upload` dan cocokkan fingerprint dengan upload certificate pada Play Console bila aplikasi sudah terdaftar. Jangan hanya mengandalkan adanya signature.

Untuk APK uji lokal: `npm run android:apk:release`. Hasilnya ada pada `android/app/build/outputs/apk/release/app-release.apk`. APK bukan artefak utama upload aplikasi baru. Aplikasi debug dengan ID sama dan signature berbeda tidak dapat ditimpa begitu saja; menghapus instalasi akan menghapus data lokal.

## 4. Gerbang Kualitas Native Dan Perangkat

- Periksa manifest hasil build melalui Android Studio APK Analyzer: ID/versi/target SDK benar, tidak debuggable, cleartext dinonaktifkan, dan tidak ada izin yang tidak diperlukan.
- Periksa semua library `.so` dengan APK Analyzer untuk alignment 16 KB, termasuk dependency prebuilt. Proyek memakai NDK r27; kompatibilitas perlu dibuktikan, bukan diasumsikan.
- Dengan bundletool yang diunduh dari sumber resmi: `java -jar /path/to/bundletool.jar validate --bundle=android/app/build/outputs/bundle/release/app-release.aab`.
- Periksa konfigurasi bundle: `java -jar /path/to/bundletool.jar dump config --bundle=android/app/build/outputs/bundle/release/app-release.aab`. Harapkan `PAGE_ALIGNMENT_16K`; ini belum membuktikan alignment ELF setiap library.
- Periksa APK uji dengan SDK Build Tools: `"$ANDROID_HOME/build-tools/37.0.0/zipalign" -c -P 16 -v 4 android/app/build/outputs/apk/release/app-release.apk`.
- Uji pada emulator/perangkat 16 KB; `adb shell getconf PAGE_SIZE` harus mengembalikan `16384`. Uji juga perangkat 4 KB dan Android 16.
- Uji instalasi melalui Internal testing Google Play agar APK hasil pemrosesan AAB ikut diuji. Verifikasi cold start tanpa Metro, login gagal/berhasil, logout, sesi tersimpan, katalog/detail, tambah/edit unit, kamera/galeri, upload foto, serta koneksi terputus.
- Periksa seluruh menu yang masih placeholder. Jangan mengiklankan fitur yang belum bekerja; selesaikan atau batasi fitur tersebut sebelum production.
- Simpan AAB dan source map Hermes `android/app/build/generated/sourcemaps/react/release/index.android.bundle.map` jika dihasilkan untuk investigasi crash. Minifikasi Java saat ini tidak aktif, sehingga mapping R8 tidak diharapkan.

## 5. Materi Dan Deklarasi Play Console

- [ ] Akun developer dan verifikasi identitas/perangkat selesai; tentukan pemilik dan akses rilis.
- [ ] Konfirmasi nama listing (maksimal 30 karakter), deskripsi singkat (80), deskripsi lengkap (4000), kategori, negara distribusi, serta gratis/berbayar.
- [ ] Siapkan ikon listing 512x512 PNG, feature graphic 1024x500, dan minimal dua screenshot ponsel dari aplikasi nyata tanpa data pribadi. Tinjau pula ikon launcher yang sudah ada; jangan memakai aset template tanpa pemeriksaan.
- [ ] Email dukungan aktif, kontak developer, dan situs dukungan jika tersedia.
- [ ] URL kebijakan privasi publik yang dapat diakses tanpa login; sertakan identitas pengelola, kontak, data yang diproses, tujuan, pihak penerima, keamanan, retensi, serta mekanisme penghapusan. Sediakan akses kebijakan privasi dari dalam aplikasi sesuai kebijakan Play; belum ditambahkan karena URL resmi belum tersedia.
- [ ] Isi Data safety berdasarkan aplikasi DAN backend: identitas/login, token, foto, konten unit, log server, pihak ketiga, enkripsi transit, retensi, dan penghapusan. Jangan memilih "tidak mengumpulkan data" hanya karena data disimpan di server sendiri. Keychain bukan alasan untuk mengabaikan data yang dikirim ke backend.
- [ ] Jika pembuatan akun tersedia di aplikasi atau alur eksternalnya, penuhi persyaratan penghapusan akun/data di dalam aplikasi dan URL permintaan penghapusan. Konfirmasi alur pembuatan akun dengan pemilik backend.
- [ ] Isi App access: akun reviewer yang aktif dan petunjuk akses semua fitur terbatas. Masukkan kredensial hanya di Play Console, bukan repository.
- [ ] Selesaikan deklarasi iklan, target audiens, content rating, dan formulir konten lain yang ditampilkan. Jangan mengasumsikan jawaban hanya dari dependency frontend.
- [ ] Aktifkan Play App Signing dan cocokkan upload certificate. Tentukan sertifikat signing Google yang diperlukan integrasi API bila ada.

## 6. Urutan Upload

1. Buat/pilih aplikasi yang benar pada Play Console; pastikan package ID sesuai.
2. Selesaikan listing dan deklarasi App content yang diminta.
3. Buka Test and release > Testing > Internal testing, buat release, dan upload AAB bertanda tangan.
4. Isi release notes sesuai fitur yang benar-benar berfungsi, selesaikan error/warning, lalu distribusikan ke tester.
5. Tinjau pre-launch report, crash, ANR, kompatibilitas perangkat, dan peringatan native 16 KB.
6. Untuk akun personal yang dibuat setelah 13 November 2023, jalankan closed test minimal 12 tester yang terus opted-in selama setidaknya 14 hari, lalu ajukan production access. Internal testing tidak menggantikannya; ikuti syarat aktual pada akun Anda.
7. Setelah hasil pengujian dan deklarasi disetujui pemilik aplikasi, ajukan review production. Untuk update yang mendukungnya, gunakan staged rollout dan pantau Android vitals.

## Referensi Resmi

Persyaratan dapat berubah; periksa kembali sebelum setiap submission.

- [Target API level Google Play](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Dukungan page size 16 KB](https://developer.android.com/guide/practices/page-sizes)
- [Persyaratan testing akun personal baru](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Signing aplikasi React Native Android](https://reactnative.dev/docs/signed-apk-android)
- [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Penghapusan akun](https://support.google.com/googleplay/android-developer/answer/13327111)