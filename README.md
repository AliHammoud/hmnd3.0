# HMND

Life-science product strategy studio site — [hmnd.design](https://hmnd.design).

## Stack

Static: `index.html` · `style.css` · `main.js` · `styles/tokens.css`

## Local preview

```bash
npx serve .
# or: python3 -m http.server 8080
```

Open the local URL so `data/work.json` and Vision fetch work under HTTP (not `file://`).

## Before launch

1. Drop `assets/hero-structure.jpg` (required — missing image fails visibly).
2. Set Calendly URL on `#calendly-slot` (`data-calendly-url`) or `CALENDLY_URL` in `main.js`.
3. Set `FORM_ENDPOINT` in `main.js` (Formspree/Getform). Until then, submit uses mailto `hello@hmnd.design`.
4. Replace anonymized cases in `data/work.json` with approved copy.
5. Confirm namable client marks in the logo strip.
