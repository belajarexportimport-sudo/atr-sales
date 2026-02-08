# SOLUSI FINAL - Revenue Tidak Tersimpan

## Masalah Sebenarnya:
- ✅ Kolom revenue **MUNCUL** (Anda admin)
- ❌ Angka yang diisi **TIDAK TERSIMPAN** ke database
- ❌ Di dashboard tetap blank/0

## Root Cause:
**Frontend belum deploy!** Code baru (dual-strategy) masih di local, belum di Vercel.

---

## SOLUSI CEPAT (2 Menit):

### Opsi 1: Manual Update PT Amuka

**Run di Supabase SQL Editor:**

```sql
UPDATE inquiries
SET 
    est_revenue = 80000,
    est_gp = 60000,
    est_commission = 1200
WHERE customer_name ILIKE '%amuka%'
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
RETURNING customer_name, est_revenue, est_gp;
```

**Lalu refresh app** → Revenue PT Amuka langsung muncul!

---

### Opsi 2: Test di Local (http://localhost:5174/)

1. Buka: http://localhost:5174/
2. Login sebagai admin
3. Create new RFQ dengan revenue
4. **Buka browser console (F12)**, lihat logs:
   - `💾 CREATE inquiry: { revenue: 100000 }`
   - `✅ INSERT success` atau `✅ RPC fallback success`
5. Kalau ada error, screenshot dan kirim ke saya

---

## SOLUSI PERMANENT (Deploy ke Vercel):

**Saya akan deploy sekarang!**

Tapi untuk **quick fix PT Amuka**, pakai **Opsi 1** (manual UPDATE).

**Mau saya deploy ke Vercel sekarang?** Atau cukup fix PT Amuka dulu dengan manual UPDATE?
