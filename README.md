HEAD
# 🤖 AI & Developer Dashboard

A curated, searchable directory of 150+ AI and developer tools — writing, research, coding, design, automation, and more — all in one place.

**[Live Demo →](#)** <!-- replace with your deployed URL once live -->

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![No Framework](https://img.shields.io/badge/Dependencies-Zero-success)

---

## ✨ Features

- 🔍 **Live search** — filter all 150+ tools instantly as you type
- 🏷️ **Pricing filter** — toggle between Free / Paid / All
- 🧭 **Category quick-nav** — jump to any of 17 categories, with scroll-tracked active highlighting
- 🎨 **Auto-fetched favicons** — with a graceful initials-avatar fallback if a favicon fails to load
- 📱 **Fully responsive** — works down to small mobile screens
- ⚡ **Zero dependencies** — no build step, no framework, no npm install. Just open `index.html`
- 🗂️ **Data-driven architecture** — all tools live in a single `tools.json` file, decoupled from markup

## 🖼️ Preview

<!-- Add a screenshot or GIF here once deployed, e.g. -->
<!-- ![Dashboard preview](./preview.png) -->

## 🧱 Tech Stack & Architecture

This project intentionally uses no frameworks or build tools — just vanilla HTML/CSS/JS — to keep it fast, dependency-free, and easy for anyone to read end to end.

```
├── index.html      # Page shell — controls, nav, and an empty <main> to render into
├── style.css        # Dark theme, responsive grid, component styles
├── app.js           # Fetches tools.json, renders cards, handles search/filter/scroll
└── tools.json        # Single source of truth: 150+ tools as structured data
```

**How it works:**
1. `app.js` fetches `tools.json` on page load
2. Tools are grouped by category and rendered into cards via template literals
3. Typing in the search box or clicking a pricing filter re-runs the render with the new criteria — no page reload
4. An `IntersectionObserver` tracks which category is in view and highlights the matching nav chip

## 🚀 Running locally

No install required:

```bash
git clone https://github.com/<your-username>/ai-developer-dashboard.git
cd ai-developer-dashboard
# then just open index.html in your browser, or serve it:
python3 -m http.server 8000
# visit http://localhost:8000
```

## ➕ Adding a new tool

Open `tools.json`, find (or add) the relevant category, and append an object:

```json
{ "name": "New Tool", "url": "https://example.com", "pricing": "free" }
```

No HTML editing required — the UI updates automatically.

## 🗺️ Roadmap

- [ ] Tags/topics per tool for cross-category filtering
- [ ] "Copy link" and "favorite" actions per card
- [ ] Dark/light theme toggle
- [ ] Automated link-checker in CI to catch dead links

## 📄 License

MIT — feel free to fork and adapt for your own tool collection.

---

Built by [Atharva Patankar]([https://linkedin.com/in/your-profile](https://www.linkedin.com/in/atharva-patankar-320580384/)) — a personal directory of the AI/dev tools I actually use, refactored into a small data-driven web app.
=======
Developer Dashboard is a curated AI resource platform designed to help users discover and choose the most suitable AI tools based on their specific use cases. Instead of overwhelming users with hundreds of AI applications, the platform organizes carefully selected tools into structured categories such as Coding & Development, Content Creation, Research & Learning, Design & Creativity, Productivity, Automation, and more. Each category enables users to quickly identify the best AI solutions for their needs, whether they are writing code, generating content, conducting research, creating designs, analyzing data, or improving workflow efficiency. Built with HTML, CSS, and JavaScript, the website provides a clean, responsive, and user-friendly interface that simplifies AI tool discovery and comparison. The goal of Developer Dashboard is to serve as a centralized directory of high-quality AI resources, helping students, developers, creators, professionals, and businesses navigate the rapidly growing AI ecosystem and find the right tools without wasting time on extensive searching and evaluation.
>>>>>>> 7234aa42a0998cb8c065190b7fcb2cc6deb1f000
