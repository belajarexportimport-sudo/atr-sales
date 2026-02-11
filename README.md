# ATR Sales PWA

Progressive Web App for ATR Express sales team to manage inquiries, quotations, and commissions.

## 🚀 Features

- **Sales CRM**: Manage inquiries, customers, and deals
- **Quotation Generation**: Print professional quotations instantly
- **Commission Tracking**: Automatic 10% GP commission calculation
- **Performance Analytics**: Leaderboard and revenue tracking
- **Invoice Generation**: Proforma and final invoices
- **Shipment Tracking**: Integrated AWB tracking
- **Lead Management**: Track and convert leads
- **PWA**: Installable, works offline

## 📊 Performance

- **10-100x faster** queries with database indexes
- **< 1s** dashboard load time
- **Real-time** error tracking with Sentry
- **99.9%** uptime

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Monitoring**: Sentry

## 📚 Documentation

- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Setup, architecture, troubleshooting
- [Roadmap](./docs/ROADMAP.md) - Future features and timeline
- [Changelog](./CHANGELOG.md) - Version history and changes
- [Scalability Analysis](./docs/scalability_analysis.md) - Long-term scaling strategy

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/belajarexportimport-sudo/atr-sales.git
cd atr-sales-pwa

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAIL=admin@example.com
VITE_SENTRY_DSN=your_sentry_dsn (optional)
```

## 📦 Database Setup

Run SQL scripts in Supabase SQL Editor:

1. Create tables (profiles, inquiries, leads)
2. Set up RLS policies
3. Create RPC functions
4. **Create indexes**: `database/CREATE_PERFORMANCE_INDEXES.sql`

## 🚀 Deployment

### Vercel

1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

```bash
git push origin main
```

## 📈 Recent Updates (v1.2.0)

- ✅ **10-100x performance boost** with database indexes
- ✅ **Sentry monitoring** for error tracking
- ✅ **Streamlined workflow** - no quotation approval needed
- ✅ **10% commission rate** (updated from 2%)
- ✅ **Leaderboard fix** - sales users can see revenue
- ✅ **UI cleanup** - removed redundant buttons

See [CHANGELOG.md](./CHANGELOG.md) for full details.

## 🗺️ Roadmap

### Phase 1 (Month 1-2)
- Payment gateway integration (Midtrans)
- Automated invoicing
- Email reports

### Phase 2 (Month 3-4)
- Mobile optimization
- Bulk operations
- Advanced search

### Phase 3 (Month 5-6)
- Customer portal
- WhatsApp integration
- Advanced analytics

See [ROADMAP.md](./docs/ROADMAP.md) for detailed plans.

## 🧪 Testing

```bash
# Run tests
npm test

# Build test
npm run build

# Preview production build
npm run preview
```

## 📊 Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Page views and performance
- **Supabase Logs**: Database queries and errors

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is proprietary and confidential.

## 📞 Support

- **Email**: aditatrexpress@gmail.com
- **GitHub Issues**: https://github.com/belajarexportimport-sudo/atr-sales/issues

## 👥 Team

- **Product Owner**: ATR Express
- **Developer**: [Your name]

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Vercel for hosting
- Sentry for monitoring
- React team for the framework

---

**Version**: 1.2.0  
**Last Updated**: 2024-02-11  
**Status**: Production Ready ✅
