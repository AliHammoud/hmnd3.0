# HMND

Life-science product strategy studio site — [hmnd.design](https://hmnd.design).

## Stack

Static: `index.html` · `works/*.html` · `style.css` · `main.js` · `styles/tokens.css`

## Local preview

```bash
npx serve .
# or: python3 -m http.server 8080
```

Open the local URL so the Vision feed fetch works under HTTP (not `file://`).

## Media placeholders

Every image/video slot is a `<figure class="media media--placeholder" data-ad="…">`. The `data-ad`
attribute is the art direction for that slot (format, ratio, subject, light, mood) and renders on the
placeholder itself. To supply an asset, drop an `<img>` or `<video>` inside the figure — the hatch and
the AD note disappear automatically; the reticle frame and `Fig.` caption stay.

| Slot | Ratio | Brief |
| --- | --- | --- |
| Hero (`.hero__media`) | 2.39:1 video, 12–20s loop | Lateral dolly across an automated deck / sequencing lab at night, LED-lit, desaturated, no people |
| Fig. 01 | 4:5 still | Printed batch sheet taped to a steel bench beside a sample rack, overhead fluorescent |
| Fig. 02 | 4:5 portrait | Principal, B&W, single hard key from the left, direct gaze |
| Fig. 03 / 03a / 03b | 21:9 · 16:9 · 16:9 | Genome browser UI; annotation detail; discovery sketch |
| Fig. 04 / 04a / 04b | 21:9 · 16:9 · 16:9 | Liquid handler long exposure; exception-surface UI; gloved hand at the deck |
| Fig. 05 / 05a / 05b | 21:9 · 16:9 · 16:9 | The taped printout in bench context; macro of the sheet; the print button |

## Before launch

1. Set `FORM_ENDPOINT` in `main.js` (Formspree/Getform). Until then, submit falls back to `mailto:hello@hmnd.design`.
2. Set `CALENDLY_URL` in `main.js` (or `data-calendly-url` on `#calendly-cta`). The "Book directly" row stays hidden until it exists.
3. Confirm the principal's name in `#thesis` and add the LinkedIn URL in the footer.
4. Confirm permission for each name in "Teams we've shipped with".
5. Supply `assets/img/og.png` (1200×630) and uncomment the `og:image` tag.
6. `data/work.json` and `assets/img/work/*.svg` are no longer read by the site; case copy lives in `works/*.html`.
