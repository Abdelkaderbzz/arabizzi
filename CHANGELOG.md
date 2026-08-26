# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.2] - 2026-08-12

### Added

- Page translation via selection pill on any website
- Right-click context menu: Translate with Arabizzi (Fusha / colloquial / English / French)
- Shared `translate.js` for popup and service worker
- Extension demo page and `test-translate.js` self-checks

### Fixed

- Empty Gemini responses caused by thinking-token budget
- Popup mode buttons now re-convert instead of only relabeling
- Textarea / keyboard selection, stale translate races, and bubble UX issues

### Changed

- Prefer `gemini-3.1-flash-lite` with model fallbacks and rate-limit retries
- Extension version bumped to 1.4.2

### Contributors

- [@moataz-hjaiji](https://github.com/moataz-hjaiji): page translation feature ([#16](https://github.com/Abdelkaderbzz/arabizzi/pull/16))
- [@Abdelkaderbzz](https://github.com/Abdelkaderbzz): review, hardening, and release

## [1.4.0] - 2026-06-23

### Added

- GitHub Actions CI for lint, build, and extension validation on pull requests and `main`
- Branch protection rules requiring reviews and passing CI checks
- Open source documentation: MIT license, code of conduct, security policy, and changelog
- CODEOWNERS, Dependabot, and expanded contributor documentation
- Mortakaz launch section and assets on the landing page

### Changed

- Upgraded to Next.js 16 with Turbopack as the default bundler
- Migrated from `next lint` to ESLint CLI with flat config
- Renamed `middleware.ts` to `proxy.ts` for Next.js 16 compatibility
- Improved output copy UI and realistic user preview on the landing page

## [1.3.0] - 2026-06-20

- Chrome extension with Fusha, Tunisian, English, and French conversion modes
- Web app with bilingual UI, history, and bookmarks

[Unreleased]: https://github.com/Abdelkaderbzz/arabizzi/compare/v1.4.2...HEAD
[1.4.2]: https://github.com/Abdelkaderbzz/arabizzi/compare/v1.4.0...v1.4.2
[1.4.0]: https://github.com/Abdelkaderbzz/arabizzi/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Abdelkaderbzz/arabizzi/releases/tag/v1.3.0
