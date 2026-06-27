# Arabizzi

[![CI](https://github.com/Abdelkaderbzz/arabizzi/actions/workflows/ci.yml/badge.svg)](https://github.com/Abdelkaderbzz/arabizzi/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Convert Tunisian Arabic written in Latin script (Arabizi) into **Arabic script** or **Modern Standard Arabic (Fusha)**, powered by Google Gemini.

**Website:** [arabizzi.com](https://arabizzi.com/) · **GitHub:** [Abdelkaderbzz/arabizzi](https://github.com/Abdelkaderbzz/arabizzi) · **Chrome extension:** [Web Store](https://chromewebstore.google.com/detail/fkgphgcloiijjpmoiiimjibjafmobnlm)

This repository includes a **Next.js web app** and a **Chrome extension** that share the same conversion logic and bilingual UI.

## What's in this repo

| Path | Description |
| --- | --- |
| `app/`, `components/` | Next.js web application |
| `extension/` | Chrome extension (Manifest V3, self-contained) |
| `netlify-landing/` | Marketing site, releases, and privacy policy |

## Features

### Web app

- Latin (Arabizi) → Tunisian Arabic script or Fusha (MSA)
- Bilingual interface (English / Arabic) with RTL support
- Fusha / Tunisian output mode selector
- One-click copy, clickable examples
- Recent conversions and saved bookmarks
- Response caching to reduce API calls

### Chrome extension

- Toolbar popup with the same Fusha / Tunisian modes
- Bring-your-own Gemini API key (stored locally in the browser)
- Copy output and recent history (last 10)
- Saved bookmarks for conversions you want to keep
- English / Arabic interface

See [extension/README.md](extension/README.md) for extension-specific setup and publishing steps.

## Examples

| Latin Input | Tunisian Output | MSA Output |
| --- | --- | --- |
| 3aslema | عسلامة | السلام عليكم |
| chneya 7alek? | شنية حالك؟ | كيف حالك؟ |
| taw nemchi lel dar | توا نمشي للدار | سأذهب إلى المنزل الآن |

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Google Gemini (`gemini-2.5-flash`) via Vercel AI SDK
- Chrome Extension Manifest V3

## Getting started (web app)

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- A free [Google AI Studio](https://aistudio.google.com/apikey) API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Abdelkaderbzz/arabizzi.git
cd arabizzi
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Add your Gemini API key to `.env`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chrome extension (quick start)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. Open the extension settings (gear icon) and paste your Gemini API key

Full details: [extension/README.md](extension/README.md)

## Development

```bash
pnpm dev      # run web app locally
pnpm landing  # static landing page (port 5174)
pnpm build    # production build
pnpm start    # start production server
pnpm lint     # run ESLint
```

Pull requests run CI automatically: **Lint**, **Build**, and **Extension** checks must pass before merge.

## Project structure

```
├── app/                 # Next.js routes and API
│   └── api/convert/     # Gemini conversion endpoint
├── components/          # React UI components
├── contexts/            # Language and history state
├── extension/           # Chrome extension source
├── lib/                 # Conversion and usage helpers
├── netlify-landing/     # Landing, releases, privacy (Web Store)
├── translations/        # English and Arabic strings
└── types/               # TypeScript declarations
```

## Privacy

The Chrome extension stores the API key and preferences locally. Conversion text is sent only to Google's Gemini API. The privacy policy lives at [arabizzi.com/privacy.html](https://arabizzi.com/privacy.html) (`netlify-landing/privacy.html`).

## Contributing

We welcome contributions from the community.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup and PR guidelines
2. Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
3. Fork the repository, create a branch, and open a pull request

## Security

To report a security vulnerability, please read [SECURITY.md](SECURITY.md) and contact us privately. Do not open public issues for security reports.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- Built for the Tunisian Arabic community
- Powered by [Google Gemini](https://ai.google.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
