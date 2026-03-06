# Split Me

Web app (React + Vite), set up to run well on phones.

## Run locally

```bash
npm install
npm run dev
```

Open the URL in your browser (e.g. `http://localhost:5173`). To test on your phone, use the same Wi‑Fi and open your machine’s local IP (Vite prints it in the terminal) or deploy to Vercel/Netlify and open the deployed URL on your phone.

## OpenAI (itemize receipt)

1. Copy `.env.example` to `.env`.
2. Add your API key: `VITE_OPENAI_API_KEY=sk-...` (get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)).
3. Restart the dev server. Take a photo of a receipt and tap **Itemize receipt** to send the image to OpenAI and get an itemized list.

**Note:** The key is embedded in the client bundle. For production, use a backend that holds the key and proxies requests.

## Build for production

```bash
npm run build
```

Output is in `dist/`. Deploy that folder to any static host (Vercel, Netlify, GitHub Pages, etc.).

---

This project uses React + Vite with HMR and ESLint.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
