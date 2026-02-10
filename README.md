# 🌳 Grove: Your AI Life Garden

Grove is a **Quantified Self** productivity tool that transforms your daily habits into a living, breathing digital garden.

## ✨ Features

-   **The Living Garden:** Visual representation of your life balance using a growing Oak (Investors), Bamboo (Skills), and Rose (Relationships).
-   **AI Tool-Calling:** Powered by Google Gemini 1.5 Flash. Tell Grove what you did in plain English, and the AI will "reach out" and grow your plants automatically.
-   **Privacy-First:** Built on a secure Supabase backbone with local-first architectural principles.
-   **Juicy UI:** Motion-responsive icons that breathe and sway using Framer Motion.

## 🛠️ The Tech Stack

-   **Framework:** Next.js 15 (App Router)
-   **Styling:** Tailwind CSS
-   **Database:** Supabase (PostgreSQL)
-   **AI Engine:** Vercel AI SDK + Google Gemini 1.5 Flash
-   **Animations:** Framer Motion
-   **Icons:** Lucide React

## 🚀 Getting Started

1.  **Clone the repo**
2.  **Setup Supabase:** Create a `garden_stats` table with `investor_oak_growth`, `typing_bamboo_growth`, and `family_rose_growth`.
3.  **Environment Variables:** Create a `.env.local` with your Supabase and Google AI Studio keys.
4.  **Install & Run:**

    ```bash
    npm install
    npm run dev
    ```

## 🧠 How it Works

Grove uses **Function Calling**. When you send a message like *"I just practiced typing,"* the LLM identifies the intent, triggers the `growPlant` tool, which executes a **Server Action** to update the PostgreSQL database in real-time.
