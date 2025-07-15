# Prompter AI – Productivity App

Prompter AI is a modern, full-stack productivity web app that combines powerful AI-driven task generation with a beautiful, responsive calendar and to-do dashboard. Built for speed, clarity, and real-world productivity, it’s your all-in-one HQ for planning, tracking, and achieving your goals.

---

## 🚀 Features

- **AI-Powered Task Generation**: Instantly turn your ideas or prompts into actionable, editable tasks using Gemini (Google Generative AI).
- **Modern Calendar Views**: Switch between weekly, monthly, and daily calendar layouts. Add, edit, and view tasks with a single click or tap.
- **To-Do Dashboard**: Manage all your tasks in a clean, kanban-style dashboard with filters, search, and quick actions.
- **Mobile Responsive**: Fully responsive UI with mobile-first design, including a hamburger menu for navigation on small screens.
- **Authentication**: Secure sign-up and sign-in flows with robust validation and error handling.
- **Export & Stats**: Export tasks as PDF/CSV, and view productivity stats and progress.
- **Instant Sync**: All changes are reflected instantly across dashboard and calendar views.
- **Accessible & Performant**: Built with accessibility and performance best practices.

---

## 🛠️ Tech Stack & Skills Demonstrated

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict, full-stack)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (utility-first, responsive)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **AI Integration**: Gemini (Google Generative AI API)
- **Validation**: [Zod](https://zod.dev/) (schema validation for all API inputs)
- **UI Components**: Custom + Headless UI primitives
- **Authentication**: Secure, session-based, with protected API routes
- **Performance**: Optimized data fetching, React Suspense, and incremental rendering
- **Accessibility**: Keyboard navigation, ARIA labels, and color contrast
- **Testing & Linting**: Type-safe, linter clean, and robust error handling

---

## 📱 Mobile Experience
- Responsive layouts for all pages (landing, auth, dashboard, calendar)
- Hamburger menu for navigation on mobile
- Touch-friendly buttons, modals, and drag/drop

---

## 🏗️ Project Structure
- `app/` – Next.js App Router pages, API routes, and components
- `app/to-dos/` – Dashboard, calendar, and all main app features
- `app/landing/` – Landing page and legal pages
- `app/AppComponents/` – Auth and shared UI components
- `public/` – Static assets (images, icons)
- `db/` – Drizzle ORM config and schema
- `stores/` – Zustand state management
- `hooks/`, `lib/` – Utilities and custom hooks

---

## ⚡️ Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Mithurn/to-do-ai.git
   cd to-do-ai
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or yarn install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your database and API keys.
4. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🚀 Deployment
- **Vercel recommended:**
  - Push to GitHub, import your repo on [vercel.com](https://vercel.com), and follow the prompts.
  - Set your environment variables in the Vercel dashboard.
- **Other platforms:**
  - The app works on any Node.js host that supports Next.js 14+.

---

## 👤 Author & Credits
- **Built by:** Mithurn Jeromme
- **Design, code, and AI integration:** Mithurn Jeromme
- **Open source:** Contributions and feedback welcome!

---

## 📄 License
This project is licensed under the MIT License.
