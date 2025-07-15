# 🧠 Prompter AI – AI-Powered Productivity App

Prompter AI is an AI-driven task planner that helps users generate, manage, and schedule their tasks through a seamless, intuitive interface. With OpenAI integration, calendar views, real-time task syncing, and a sleek design – it's your productivity co-pilot.

---

## 🔗 Live Demo

👉 [Try the App Live](https://prompter-ai-rev.vercel.app)

🎥 **Watch Demo Video:**  
[Watch on YouTube](https://www.youtube.com/watch?v=qOptGJ0bUuw)

---

## ✨ Features

- ✅ AI-generated task suggestions via natural language
- 📅 Weekly & Monthly calendar views
- 📂 Dashboard to view all upcoming tasks
- 🔐 Authentication system (Lucia Auth + PostgreSQL)
- 💾 Task persistence with secure session cookies
- 🌐 Deployed on Vercel (frontend) and Neon DB (backend)
- 🔍 "Show more" functionality for overloaded calendar cells
- 🌘 Clean, responsive UI with dark mode support

---

## 🖼️ Screenshots

### 🔍 AI-Powered Task Generation
![AI-feature](https://github.com/user-attachments/assets/7f18341e-aef9-45f6-9d10-7bf37e765975)

### 📋 Dashboard View
![dashboard](https://github.com/user-attachments/assets/a8867175-12aa-4e11-8ec2-7d88c59b51b7)

### 📆 Calendar Planner
![calendar](https://github.com/user-attachments/assets/6d2f1738-92b4-44f9-bc8e-793721ebc021)

---

## 🧰 Tech Stack

| Category   | Stack                                             |
|------------|---------------------------------------------------|
| **Frontend** | Next.js 14, App Router, Tailwind CSS, TypeScript |
| **Backend**  | API Routes, Drizzle ORM                          |
| **Database** | PostgreSQL (Neon)                                |
| **Auth**     | Lucia Auth                                       |
| **AI**       | GeminiAI API (prompt-to-task conversion)         |
| **Deploy**   | Vercel                                           |

---

## 🛠️ Local Development Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/Mithurn/to-do-ai.git
cd to-do-ai

pnpm install  # or npm install
cp .env.example .env  # Set your environment variables

pnpm dev      # or npm run dev
.env.example
DATABASE_URL=your_neon_postgres_url
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
---
🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss your idea.

If you're a developer interested in improving task management using AI — feel free to fork and experiment!
---

👤 Author

Mithurn Jeromme

🌐 LinkedIn: www.linkedin.com/in/mithurn-jeromme-s-k

📫 Email: mithurnjeromme172@gmail.com

🌟 Show Your Support

If you like this project, consider:

⭐️ Starring the repo
🗣 Sharing it on social media
🛠 Reaching out for collaboration

---

## 📝 License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for details.
