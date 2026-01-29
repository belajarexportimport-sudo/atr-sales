# ATR Express Sales CRM PWA

Progressive Web App untuk tim sales lapangan ATR Express.

## 🚀 Status Project

**Project Structure**: ✅ Complete  
**Dependencies**: ⚠️ Partial (network issues)  
**UI Components**: ✅ Placeholder ready  
**Backend Integration**: ⏳ Pending Supabase setup

## 📋 Prerequisites

1. **Node.js** v18+ dan npm
2. **Supabase Account** - Buat project di [supabase.com](https://supabase.com)
3. **Network stabil** untuk install dependencies

## 🔧 Installation

### 1. Install Missing Dependencies

Karena ada network timeout saat setup, jalankan manual:

```bash
cd c:/Users/LENOVO/.gemini/antigravity/scratch/atr-sales-pwa
npm install react-router-dom @supabase/supabase-js lucide-react react-hook-form date-fns clsx tailwind-merge
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` dan isi dengan Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_EMAIL=aditatrexpress@gmail.com
```

### 3. Run Development Server

```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── contexts/       # AuthContext (placeholder)
├── lib/           # Supabase client, utilities
├── pages/         # LoginPage, DashboardPage, InquiryFormPage
├── components/    # (akan ditambahkan)
├── App.jsx        # Main app dengan placeholder routing
└── index.css      # Tailwind base styles
```

## 🗄️ Database Setup (Next Steps)

Buat tables di Supabase:

1. **inquiries** - Data inquiry customer
2. **profiles** - User profiles (linked to auth)
3. **commission_rules** - Formula komisi

SQL schema akan disediakan setelah Supabase project ready.

## 🎨 Features

- ✅ PWA Manifest (installable)
- ✅ Tailwind CSS configured
- ✅ Mobile-first responsive design
- ⏳ Supabase Auth (pending)
- ⏳ RLS Policies (pending)
- ⏳ Email notifications (pending)

## 📝 Notes

- UI components sudah dibuat sebagai placeholder
- Routing menggunakan simple state (akan diganti react-router-dom)
- Auth logic akan diimplementasi setelah dependencies terinstall
- Commission calculation formula: `(Revenue - GP) * 2%`

## 🚧 Known Issues

- Dependencies belum lengkap terinstall (network timeout)
- Supabase client belum diinisialisasi
- Router belum menggunakan react-router-dom

## 👤 Contact

ATR Express Development Team
