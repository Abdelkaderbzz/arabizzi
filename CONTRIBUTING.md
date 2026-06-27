# Contributing to Arabizzi

Thank you for your interest in contributing. This project includes a **Next.js web app**, a **Chrome extension**, and static pages for privacy policy and marketing.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- Report bugs using the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml)
- Suggest features using the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml)
- Ask questions in [GitHub Discussions](https://github.com/Abdelkaderbzz/arabizzi/discussions)
- Open a pull request with a fix or enhancement
- Improve documentation, translations, or conversion prompts

## Getting started

1. Fork the repository: [arabizzi](https://github.com/Abdelkaderbzz/arabizzi)
2. Clone your fork and create a branch from `main`:

```bash
git clone https://github.com/<your-username>/arabizzi.git
cd arabizzi
git checkout main
git pull origin main
git checkout -b feature/my-change
```

3. Install dependencies for the web app:

```bash
pnpm install
cp .env.example .env
```

4. Add your Gemini API key to `.env` for local web app testing.

Never commit `.env` or real API keys. Use `.env.example` as the template only.

## Development workflows

### Web app

```bash
pnpm dev
pnpm lint
pnpm build
```

### Chrome extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. Use your own Gemini API key in the extension settings

Package for the Web Store:

```bash
cd extension && zip -r ../arabizzi-extension.zip . -x "icons/generate.js"
```

### Landing page

Preview the static marketing site locally:

```bash
pnpm landing
```

Open [http://localhost:5174](http://localhost:5174). See [netlify-landing/README.md](netlify-landing/README.md) for deploy details.

## Pull request guidelines

- Open PRs against the `main` branch
- Keep PRs focused on one change when possible
- Use the [pull request template](.github/pull_request_template.md)
- Ensure CI passes: **Lint**, **Build**, and **Extension**
- Test the area you changed (extension popup, web app, or docs)
- Update README or extension docs if behavior changes

## Project areas

| Path | Purpose |
| --- | --- |
| `app/`, `components/` | Next.js web application |
| `extension/` | Chrome extension (Manifest V3) |
| `netlify-landing/` | Marketing landing page, releases, and privacy policy |
| `translations/` | English and Arabic UI strings |

## Code style

- Match the existing patterns in each area (TypeScript/React for the web app, plain JS for the extension)
- Keep changes minimal and scoped to the task
- Prefer clear variable names and self-explanatory code over excessive comments
- Run `pnpm lint` before opening a PR

## Security

If you discover a security issue, do **not** open a public issue. Read [SECURITY.md](SECURITY.md) and report it privately.

## Questions

If you are unsure whether an idea fits the project, open a feature request issue or start a discussion first. That helps align on scope before you invest time in a PR.

**Website:** [arabizzi.com](https://arabizzi.com/) · **Repository:** [github.com/Abdelkaderbzz/arabizzi](https://github.com/Abdelkaderbzz/arabizzi)
