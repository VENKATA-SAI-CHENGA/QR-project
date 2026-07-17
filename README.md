# QRFlux

**One QR code, every destination.**

QRFlux is a full-stack QR code platform — not just a generator. Create dynamic and static QR codes for websites, WhatsApp, UPI payments, Wi-Fi, digital business cards, bio-link pages, and more. Customize colors, track every scan, and update destinations without ever reprinting a code.

🔗 **Live demo:** [qr-project-alpha-five.vercel.app](https://qr-project-alpha-five.vercel.app)

---

## ✨ Features

- **11 QR code types** — Website URL, Multi-Link (bio page), Digital Business Card (vCard), WhatsApp, Phone Call, SMS, Email, Wi-Fi, UPI Payment, Google Maps, and Plain Text.
- **Dynamic QR codes** — Change the destination of a URL, multi-link, or vCard QR at any time without regenerating or reprinting the code.
- **Static QR codes** — Payload is encoded directly into the image for content that never needs to change.
- **Scan analytics** — Every scan is logged with user agent and referrer; dashboards show total scans and active code counts.
- **Custom styling** — Choose foreground/background colors per QR code.
- **Export options** — Download any QR code as PNG or SVG.
- **Hosted landing pages** — Multi-link (bio page) and digital business card QR types render a live, mobile-friendly page instead of a raw redirect, complete with a "Save contact" vCard download.
- **Authentication & per-user dashboards** — Email/password auth via Supabase, with a searchable, filterable dashboard of all your QR codes.
- **Row-Level Security** — Postgres RLS policies ensure users can only manage their own QR codes while scan redirects remain publicly accessible.

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR) |
| Routing / Data | [TanStack Router](https://tanstack.com/router) + [TanStack Query](https://tanstack.com/query) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Backend / DB | [Supabase](https://supabase.com/) (Postgres, Auth, Row-Level Security) |
| QR Generation | [`qrcode`](https://www.npmjs.com/package/qrcode) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Build tool | Vite |
| Hosting | [Vercel](https://vercel.com/) |

## 🗂️ Project Structure

```
src/
├── components/
│   ├── qr-form.tsx        # Dynamic form fields per QR type
│   ├── qr-preview.tsx     # Live canvas preview + PNG/SVG export
│   └── ui/                # shadcn/ui component library
├── lib/
│   ├── qr-types.ts        # QR type definitions & payload builders
│   └── use-auth.ts        # Auth helper hooks
├── integrations/
│   └── supabase/          # Supabase client (browser + server)
├── routes/
│   ├── index.tsx          # Landing page
│   ├── auth.tsx           # Sign in / sign up
│   ├── r.$slug.tsx         # Public redirect / bio-page / vCard renderer
│   └── _authenticated/
│       ├── dashboard.tsx  # QR code list, search & filters
│       ├── qr.new.tsx     # Create a QR code
│       ├── qr.$id.tsx     # Edit a QR code + scan analytics
│       └── profile.tsx    # Account settings
supabase/
└── migrations/            # Database schema & RLS policies
```

## 🗄️ Database Schema

Three core tables, all protected by Row-Level Security:

- **`profiles`** — one row per user, auto-created on signup via trigger.
- **`qr_codes`** — the QR codes themselves (type, content, styling, target URL, active/paused state, scan count).
- **`qr_scans`** — a log of every scan (user agent, referrer, timestamp) linked to a QR code.

Public redirect pages (`/r/:slug`) can read active QR codes and insert scan records anonymously; only the owner can create, edit, or view analytics for their own codes.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (or [Bun](https://bun.sh/))
- A [Supabase](https://supabase.com/) project

### 1. Clone & install

```bash
git clone https://github.com/VENKATA-SAI-CHENGA/QR-project.git
cd QR-project
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key

VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Set up the database

Run the SQL migrations in `supabase/migrations/` against your Supabase project (via the Supabase SQL editor or the Supabase CLI):

```bash
supabase db push
```

This creates the `profiles`, `qr_codes`, and `qr_scans` tables along with their RLS policies and triggers.

### 4. Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the port shown in your terminal).

### 5. Build for production

```bash
npm run build
npm run preview
```

## ☁️ Deployment

This project is deployed on **Vercel**. To deploy your own instance:

1. Push this repo to GitHub.
2. Import the repository into [Vercel](https://vercel.com/new).
3. Add the environment variables listed above in the Vercel project settings.
4. Deploy — Vercel will run `npm run build` automatically.

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss any major changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a Pull Request

## 📄 License

[Add your license here, e.g. MIT]

---

Built with ❤️ using TanStack Start and Supabase.
