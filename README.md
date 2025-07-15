# 🧠 Prompter AI – AI-Powered Productivity App

Prompter AI is an AI-driven task planner that helps users **generate**, **manage**, and **schedule** their tasks through a seamless, intuitive interface. With OpenAI integration, calendar views, real-time task syncing, and a sleek design – it's your productivity co-pilot.

---

## 🔗 Live Demo

👉 [Try the App Live](https://prompter-ai-rev.vercel.app)

🎥 **Watch Demo Video (1m 33s)**  
[![Demo Video]([https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://youtu.be/YOUR_VIDEO_ID](https://www.youtube.com/watch?v=qOptGJ0bUuw))

---

## ✨ Features

- ✅ AI-generated task suggestions via natural language
- 📅 Weekly & Monthly calendar views
- 📂 Dashboard to view all upcoming tasks
- 🔐 Authentication system (Lucia Auth + PostgreSQL)
- 💾 Task persistence with secure session cookies
- 🌐 Deployed on **Vercel** (frontend) and **Neon DB** (backend)
- 🔍 "Show more" functionality for overloaded calendar cells
- 💡 Clean, responsive UI with dark mode support

---

## 🖼️ Screenshots

### 🔍 AI-Powered Task Generation
<img width="100%" alt="AI-feature" src="https://github.com/user-attachments/assets/33229bcf-f294-438e-b1af-71960beba839" />

### 📋 Dashboard View
<img width="100%" alt="dashboard" src="https://github.com/user-attachments/assets/a8867175-12aa-4e11-8ec2-7d88c59b51b7" />

### 📆 Calendar Planner
<img width="100%" alt="calendar" src="https://github.com/user-attachments/assets/6d2f1738-92b4-44f9-bc8e-793721ebc021" />

---

## 🧰 Tech Stack

| Category     | Stack                                                  |
|--------------|--------------------------------------------------------|
| **Frontend** | Next.js 14, App Router, Tailwind CSS, TypeScript       |
| **Backend**  | API Routes, Drizzle ORM                                |
| **Database** | PostgreSQL (hosted on [Neon](https://neon.tech))       |
| **Auth**     | [Lucia Auth](https://lucia-auth.com)                   |
| **AI**       | GeminiAI API (for prompt-to-task conversion)             |
| **Deploy**   | Vercel                                                 |

---

## 🛠️ Local Development Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/Mithurn/to-do-ai.git
cd to-do-ai

pnpm install  # or npm install
cp .env.example .env  # Set your environment variables

pnpm dev      # or npm run dev


##.env.example
DATABASE_URL=your_neon_postgres_url
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

```
---
🤝 Contributing

Pull requests are welcome! For major changes, please open an issue to discuss your idea.

If you're a developer interested in improving task management experiences using AI, feel free to fork and experiment!

---

👤 Author

Mithurn Jeromme
🌐 LinkedIn
💼 Portfolio (optional)
📫 Contact: your-email@example.com (optional)

---
🌟 Show Your Support

If you like this project, please consider:

⭐️ Starring the repo
🗣 Sharing it on social media
🛠 Reaching out for collaboration or improvements
---
License
MIT License

Copyright (c) 2025 Mithurn Jeromme

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.




