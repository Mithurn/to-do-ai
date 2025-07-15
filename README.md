<img width="1463" height="748" alt="AI-feature" src="https://github.com/user-attachments/assets/33229bcf-f294-438e-b1af-71960beba839" /># Prompter AI – Productivity App

# 🧠 Prompter AI

Prompter AI is a powerful AI-powered task planner that lets users generate, manage, and schedule tasks directly from a smart interface. With features like AI-assisted task creation, calendar integration (weekly & monthly), and real-time syncing, Prompter AI is your productivity co-pilot.

🔗 [Live Site](https://prompter-ai-rev.vercel.app)

---

## 🚀 Features

- ✅ AI-generated task suggestions
- 📅 Weekly and Monthly calendar views
- 📂 Task dashboard for easy management
- 🔐 Auth system with secure login/signup using Lucia Auth + PostgreSQL
- 🌐 Fully deployed on **Vercel** with **Neon DB** backend
- 💾 Persistent task saving across sessions
- 🔍 "Show more" functionality for calendar cells with many tasks

---
##Demo 
<img width="1463" height="748" alt="AI-feature" src="https://github.com/user-attachments/assets/7f18341e-aef9-45f6-9d10-7bf37e765975" />
<img width="1460" height="748" alt="dashboard" src="https://github.com/user-attachments/assets/a8867175-12aa-4e11-8ec2-7d88c59b51b7" />
<img width="1462" height="742" alt="Screenshot 2025-07-15 at 1 35 55 PM" src="https://github.com/user-attachments/assets/6d2f1738-92b4-44f9-bc8e-793721ebc021" />



## 🧰 Tech Stack

- **Frontend**: Next.js 14 / App Router / Tailwind CSS / TypeScript
- **Backend**: API Routes with Drizzle ORM
- **Database**: PostgreSQL (hosted on Neon)
- **Authentication**: Lucia Auth
- **Deployment**: Vercel
- **ORM**: Drizzle
- **AI**: OpenAI (or similar, if applicable)

---

## 📦 Installation (Local Dev)

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
pnpm install # or npm install
cp .env.example .env # Add your env vars
pnpm dev # or npm run dev
