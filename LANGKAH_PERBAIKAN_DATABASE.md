# 🔧 Langkah Perbaikan Database Revenue & Commission

## Masalah yang Terjadi:
1. ✅ Frontend sudah diperbaiki (v4.3)
2. ❌ **Database belum diperbaiki** - Revenue masih blank, Commission salah

---

## LANGKAH WAJIB - Jalankan SQL Script di Supabase

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com
- Pilih project ATR Sales
- Klik menu **SQL Editor** (ikon ⚡ di sidebar kiri)

### 2. Jalankan Script Perbaikan
- Klik **"+ New Query"**
- Copy semua isi file `FIX_ALL_OPS_RPC.sql` 
- Paste ke SQL Editor
- Klik **RUN** (atau tekan Ctrl + Enter)

### 3. Tunggu Sampai Selesai
- Akan muncul pesan sukses: "Success. No rows returned"
- Ini normal karena script hanya membuat/update fungsi RPC

### 4. Test di Aplikasi
- Kembali ke aplikasi (localhost:5173)
- Refresh halaman (Ctrl + Shift + R)
- Login sebagai Admin
- Buka menu **Operations** (🏢)
- Coba approve inquiry yang masih pending
- Input Revenue dan Commission
- Klik **Approve**

---

## Apa yang Diperbaiki oleh SQL Script?

Script `FIX_ALL_OPS_RPC.sql` akan memperbaiki 3 fungsi penting:

1. **`approve_quote`** - Menyimpan Revenue & GP dengan benar
2. **`get_pending_quotes`** - Menampilkan data Revenue & GP
3. **`get_pending_commissions`** - Menampilkan Commission dengan benar

---

## ⚠️ PENTING

**Inquiry yang sudah di-approve SEBELUM menjalankan script ini akan tetap blank!**

Untuk inquiry lama yang blank:
- Anda perlu **re-approve** inquiry tersebut
- Atau edit manual di Supabase Table Editor

---

## Jika Masih Bermasalah

Screenshot error message dari Supabase SQL Editor dan kirim ke saya.
