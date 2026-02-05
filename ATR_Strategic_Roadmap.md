# ATR Sales PWA - Strategic Roadmap (The "Uber-Sales" Model)

## 1. Core Philosophy
- **Open Market:** "Cepat-cepatan" (First Come First Serve).
- **Freelance Focused:** Mengandalkan sales freelance dengan insentif komisi besar.
- **Admin-Driven Supply:** Admin inject RFQ ke dalam "Pool", Sales freelance berebut mengambilnya ("Grab").

## 2. Lead Distribution Rules
- **The Pool:** Leads inject-an Admin bersifat terbuka (Open Leads) sebelum diambil.
- **The Locking & Duplicates:**
    - **Identical RFQ:** Jika `Nama Customer` DAN `Detail RFQ` sama persis -> **First Input Wins**. Input kedua ditolak/blocked oleh sistem.
    - **Similar but Different:** Jika `Nama Customer` sama tapi `Detail RFQ` beda (walau sedikit) -> **ALLOWED** (Boleh masuk).
        - *Notes:* Ini akan masuk antrian **Review Admin** untuk dinilai apakah ini strategi sales (beda-bedain dikit) atau valid.
- **Validasi Vendor/Broker:**
    - Karena banyak sales adalah broker, nama customer akhir (End User) bisa disamarkan/bebas.
    - Biarkan mekanisme pasar (harga & respon) yang menentukan pemenang jika ada double lead dari sumber berbeda.

## 3. Data Integrity & Security (The Filter)
- **Review Manual:** Audit kesesuaian data hanyalah **RFQ vs CIPL (Final)**.
    - Nama boleh beda, tapi Spesifikasi Barang (Berat/Dimensi/Komoditas) HARUS SAMA/WAJAR.
- **Sanksi (Human-First):**
    - Jika ada indikasi manipulasi (fraud), tidak langsung auto-ban bye system.
    - Ada tahap **Investigasi & Komunikasi** dulu antara Admin & Sales.
    - Sanksi bertingkat: Teguran -> Penurunan Rating -> Freeze Commission -> Blokir Akun.

## 4. Financial Safety (The Hard Rule) 🚨
- **FULL PAYMENT RULE:**
    - **Tidak ada DP.** Wajib **FULL PAYMENT**.
    - Fitur **"Generate AWB"** terkunci total sampai status finance = `FULL_PAID`.
    - **Sales Bailout:** Sales diperbolehkan menalangi (pakai uang sendiri) agar AWB keluar cepat, baru menagih ke customer. Ini dianggap sebagai *Sales Effort*.
    - Ini adalah benteng terakhir untuk mencegah kerugian ATR.

## 5. Future Development (Tech Specs)
- **Realtime Notification:** Notifikasi "New Lead Available" ala Ojol.
- **Rating System:** Bintang 5 untuk Sales (berbasis performa & kejujuran).
- **Tiering Access:**
    - Tier Bawah: Hanya lihat Lead Ad-hoc/Kecil.
    - Tier Atas (Trusted): Bisa lihat/ambil Lead Project Besar.
