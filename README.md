# Matte Studio — website

Static site built with Vite, GSAP and Lenis. Hosted on Cloudflare Pages.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Edit common things

| What | Where |
|---|---|
| Copy, sections, prices, FAQ | `index.html` |
| Email, booking link, social links, discount | `src/config.js` |
| Colours, type, spacing | top of `src/styles.css` (same tokens as the Figma library) |
| Motion | `src/main.js` |

### Images and videos

- Posters live in `public/media/`: `vertical-a.jpg`, `vertical-b.jpg`, `square.jpg` and `landscape.jpg`. Replace them with files that use the same names.
- To play a real video, set `data-video="./media/your-file.mp4"` on any `[data-play]` element. These are the work cards, testimonials and the big video. A hero reel takes a `data-video` on its `[data-reel]` element.
  - Hero reels autoplay muted.
  - Cards preview on hover and open in a player when clicked.
- Keep each clip short and compressed (under 8 MB). Host long videos on Cloudflare Stream, Bunny, Vimeo or YouTube instead.

### Prices

The prices are placeholders, `[00,000]`. Put plain numbers in `data-monthly` (for example `45000`). The "Every 3 months" switch then calculates the discount set in `src/config.js`. If you want to set the 3-month price yourself instead, put a number in `data-quarterly`.

## Forms

The forms post to `/api/review` and `/api/contact`. These are handled by `worker/index.js` (and by `functions/api/` if you use Pages instead):
- `review.js` — free reel review
- `contact.js` — book a call

Emails are sent through [Resend](https://resend.com). Add these variables in Cloudflare → your Worker → Settings → Variables and Secrets:

- `RESEND_API_KEY`
- `TO_EMAIL` — where you want submissions to arrive
- `FROM_EMAIL` — an address on a domain you've verified in Resend

If `bookingUrl` is set in `src/config.js` (Cal.com or Calendly), "Book a free call" opens that page instead of the built-in form.

## Deploy (Cloudflare Workers)

The site is deployed as a Cloudflare Worker, set up in `wrangler.jsonc`. The Worker serves the built files from `dist/`, and `worker/index.js` handles the two form endpoints.

1. Connect the GitHub repository in Cloudflare: Workers & Pages → Create → Import a repository.
2. Use these settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
3. Add the form variables listed above under Settings → Variables and Secrets.
4. To use your own domain, open Settings → Domains & Routes → Add → Custom domain.

`functions/` is kept so the site also works if you move it to Cloudflare Pages later.
