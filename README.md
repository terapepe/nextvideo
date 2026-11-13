# NextVideo

AI video studio for the web, paid with **$NEXT**. Live at [nextvideo.top](https://nextvideo.top).

Static site (plain HTML / CSS / JS, no build step), deployed on Vercel from `main`.

Layout follows the powertokens.ai platform (dark theme, sidebar): **Dashboard**, **Models** (provider / type filters, search),
**Providers**, **Pricing**, **API Keys**, **Video Studio** and **$NEXT Token**. URLs are clean paths (`/models`, `/studio` …) via `vercel.json` rewrites.

Video Studio tabs follow the PowerTokens Video Studio desktop app: **Generate video** (presets, prompt detection, reference media, seed),
**Chat**, **Compare models** (2–3 models side by side), **Batch import** (Excel / CSV, series characters, continue from previous clip),
**History / Resume** and **Pay with $NEXT** (wallet + contract addresses). Generating requires a wallet holding $NEXT.

## Configuration

Everything you may need to change lives in **`js/config.js`**:

| Setting | Where |
|---|---|
| Brand name, tagline, email | `brand` |
| Token name / symbol | `token.name`, `token.symbol` |
| Single or multi network | `token.mode` = `"single"` or `"multi"` |
| Network shown in single mode | `token.singleNetwork` = `solana` · `robinhood` · `base` · `bsc` |
| Network order in multi mode | `token.multiOrder` |
| Contract addresses | `token.evmAddress` (Robinhood / Base / BSC), `token.solanaAddress` |
| Per-network CA / tagline (single mode) | `token.chains.<network>.ca`, `.tagline` |
| X / Telegram | `socials.x`, `socials.telegram` |
| $NEXT price per second | `pricing`, e.g. `{ "720p": 10, "1080p": 20 }` |
| Backend API | `api.baseUrl` (empty = preview, nothing is submitted) |
| Models, providers and presets | `models` (`provider`, `types`), `providers`, `presets` |

### Modes

- **single** — only `singleNetwork` is shown, and the whole site is themed in that network's colors (Solana purple/green, Robinhood lime, Base blue, BNB yellow).
- **multi** — always shows all 4 networks (Solana, Robinhood, Base, BSC). Robinhood, Base and BSC share one contract address (`evmAddress`); Solana uses `solanaAddress`.

## Files

```
index.html            page markup
css/style.css         base layout (from PowerTokens Video Studio Web, MIT)
css/nextvideo.css     NextVideo brand + per-network themes
js/config.js          all settings
js/chains.js          network registry, single/multi logic, CA grouping
js/token.js           $NEXT UI: CA cards + copy, pay tab, socials, footer
js/app.js             studio UI: tabs, presets, models, detection, reference media, history, chat
js/router.js          page router (clean URLs) + mobile sidebar
js/pages.js           Dashboard, Models, Providers, Pricing, API Keys
js/compare.js         Compare models tab
js/batch.js           Batch import tab (desktop-compatible column headers)
js/xlsx-lite.js       dependency-free .xlsx / .csv reader
js/wallet.js          wallet connect + on-chain $NEXT balance check
js/wallet-ui.js       wallet button, connect modal, holder gate
assets/templates/     batch sample spreadsheets
assets/logo.svg       NextVideo logo
assets/chains/*.svg   network icons
```

## Credits

UI based on [PowerTokens/video-studio-web](https://github.com/PowerTokens/video-studio-web) and [PowerTokens/video-studio](https://github.com/PowerTokens/video-studio) (MIT). See `LICENSE`.
