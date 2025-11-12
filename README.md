# ⚙️ DemoForge — Interactive API Demo Generator

DemoForge transforms static API endpoints into **live, visual, and AI-explained demos**.

Built with **React + Express + Anthropic Claude**, it helps product and sales teams showcase APIs in a way anyone can understand — no code required.

### ✨ Features
- 🧩 Interactive Playground — visualize request/response flow  
- 🎬 Animated Journey — watch API calls “travel” from request → response  
- 💬 AI Explain (Claude) — plain-English summaries and key values  
- 🌐 Demo Mode — safe for public demos (no API credits used)  
- 📦 Export — one-click shareable HTML demo  

### 🏗️ Stack
**Frontend:** React (Vite) + Framer Motion  
**Backend:** Node.js / Express + Zod validation  
**AI:** Anthropic Claude (Haiku)  
**Deploy:** Render (server) + Netlify (client)

### 🧰 Setup
```bash
# Clone & install
git clone https://github.com/priyankbagad/DemoForge.git
cd DemoForge

# Server
cd server
cp .env.example .env
npm install
npm run dev

# Client
cd ../client
npm install
npm run dev
