# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

HackerBank: a fictional bank web app built as an educational cybersecurity
lab for HackerTech UTN-FRC. It demonstrates the difference between an
**intentionally insecure** facial authentication flow (Modo A — vulnerable
to photo spoofing, no liveness detection) and a **real FIDO2/WebAuthn**
flow (Modo B — biometrics never leave the user's device). The challenge for
students is to break Modo A by showing a photo to the webcam, then explain
why Modo B resists the same attack. Full writeup for instructors lives in
[INSTRUCTOR_GUIDE.md](INSTRUCTOR_GUIDE.md); student-facing setup is in
[README.md](README.md).

**Do not "fix" the vulnerability in `face_auth.py` unless explicitly asked.**
The lack of liveness detection there is the entire point of the lab. Note
that the preprocessing (`_normalize_lighting` via CLAHE, `equalizeHist`
before Haar detection) and enrollment sample counts (`FACE_ENROLL_SAMPLES`,
`FACE_ENROLL_MIN_SAMPLES` in `config.py`) were deliberately tuned to reduce
**false rejects for legitimate users** — this is a robustness improvement,
not a security fix: `FACE_ORB_MIN_MATCHES` (the actual exploitable
threshold) and the total absence of liveness are untouched, so a printed
photo of the enrolled user still passes exactly as before.

## Commands

```bash
# Setup (Windows)
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Seed the demo user (Carlos Rodríguez) — idempotent, no-ops if already present
python seed.py

# Run the dev server (http://localhost:5000)
python app.py
```

There is no test suite, linter, or build step configured in this project —
verification is done by exercising the running app (see README's
"Cómo documentar el ataque" section for the manual test flow).

To re-seed from scratch, delete `hackerbank.db` and re-run `python seed.py`.

## Architecture

Flask app, server-rendered Jinja2 templates + vanilla JS, SQLite via a thin
DAO layer. No ORM, no frontend framework/build step.

- **`config.py`** — single source of truth for every constant: lab
  credentials, the demo user's financial data, WebAuthn RP/origin config,
  and the intentionally-lenient face-match threshold
  (`FACE_ORB_MIN_MATCHES`). Change thresholds here, not inline in
  `face_auth.py`.
- **`db.py`** — all SQL lives here as parameterized queries
  (`sqlite3.Row` + `?` placeholders). Tables: `users`, `cards`, `movements`,
  `webauthn_credentials`, `webauthn_challenges`. Route handlers and the
  auth modules never touch SQL directly — they call functions from this
  module.
- **`seed.py`** — one-shot script that inserts the demo user Carlos
  Rodríguez, his two cards, and six movements. Skips silently if the user
  already exists.
- **`accounts.py`** — business logic for self-service signup (`create_account`):
  generates a plausible CBU/alias, hashes the password, and creates the
  user's cards + welcome movements via `db.py`. Used by the `/api/signup`
  route in `app.py`; keeps that logic out of the route handler.
- **`rate_limit.py`** — in-memory sliding-window brute-force guard
  (`is_blocked` / `record_failure` / `reset`), keyed by whatever the caller
  passes (e.g. the attacked account's email). State lives in process memory,
  which is fine only because `app.run()` is single-worker
  (`use_reloader=False`); a multi-process deployment would need a shared
  store instead.
- **`face_auth.py`** — Modo A's entire "security" logic, exposed as
  `enroll(frame_b64)` (signup: extract+store one face sample),
  `enroll_from_image_path(path)` (same, from a file — used by `seed.py`),
  and `identify(frame_b64, enrolled_faces)` (login: best-match search over
  a list of `(user_id, face_png)` pairs). Pipeline per frame: decode base64
  → Haar cascade face detection (on a `cv2.equalizeHist`-ed copy, to cope
  with over/under-exposed frames) → crop the largest face → resize to
  `config.FACE_COMPARE_SIZE` → `_normalize_lighting` (Gaussian blur + CLAHE,
  *not* a global min-max stretch — CLAHE equalizes contrast per 8×8 tile,
  which keeps ORB's local keypoints stable across lighting differences
  between the enrolled sample and a live camera frame) → ORB feature
  extraction + `BFMatcher` count against each stored sample. No temporal or
  liveness signal is ever used — this is deliberate and heavily commented
  in the file itself. `app.py` calls `identify()` scoped to only the
  *already password-identified* user's own samples (see auth flow below),
  so in practice this is a 1:1 check even though the function itself can do
  1:N. A user can have several stored samples (`FACE_ENROLL_SAMPLES` frames
  attempted at signup, `FACE_ENROLL_MIN_SAMPLES` required to succeed) —
  more samples make future logins more tolerant of lighting/angle
  variation without changing `FACE_ORB_MIN_MATCHES`.
- **`webauthn_auth.py`** — Modo B's logic via `py_webauthn`
  (`generate_registration_options` / `verify_registration_response` /
  `generate_authentication_options` / `verify_authentication_response`).
  Challenges are persisted per-user in `webauthn_challenges` between the
  `begin` and `complete` API calls; credential public keys + sign counts
  are persisted in `webauthn_credentials`.
- **`app.py`** — all routes. Two decorators gate access:
  `require_pre_auth` (password step passed, biometric step pending) and
  `require_authenticated` (fully logged in). `session[SESSION_KEY_AUTH_VIA]`
  records which mode the user actually authenticated through, but
  `/dashboard` doesn't currently branch its template on it — despite
  `INSTRUCTOR_GUIDE.md` describing a `CHALLENGE_CODE` constant in
  `config.py` and a dashboard banner shown once a student beats Modo A, **no
  such constant or banner exists anywhere in the code**, in any commit since
  the initial one. This isn't a regression to "fix" quietly — it's a gap
  between the instructor doc and the actual app that's worth flagging to a
  human before building it, since the instructor doc may also just be
  ahead of what was implemented. A `currency` Jinja filter formats floats as
  es-AR currency (`.` thousands, `,` decimals), used by both the dashboard
  and the landing page's public banking content (exchange rates, product
  cards).
- **`public_tunnel.py`** — opens a public ngrok tunnel on startup (see
  below). Fully decoupled from Flask: `open_tunnel(port)` returns a URL
  or `None`, `close_tunnels()` tears it down. `app.py` calls this only
  inside `if __name__ == "__main__"`, never on import (so `flask
  test_client()`-based checks never spawn a tunnel).

### Session-based auth flow (both modes share this shape)

1. `POST /api/login` validates email+password, sets
   `session[SESSION_KEY_PRE_AUTH]` (user id) and
   `session[SESSION_KEY_AUTH_MODE]` (which biometric mode was chosen), and
   returns the next URL (`/face` or `/webauthn`).
2. The biometric page (`GET /face` or `GET /webauthn`) is gated by
   `require_pre_auth` and cross-checks the stored `AUTH_MODE` matches the
   page — you can't hit `/face` after choosing Modo B, etc.
3. On successful biometric verification, the API route sets
   `session[SESSION_KEY_AUTHENTICATED] = True` and
   `session[SESSION_KEY_AUTH_VIA]` = the mode actually used, then returns
   `/dashboard` as `next`.
4. `GET /dashboard` is gated by `require_authenticated`. `SESSION_KEY_AUTH_VIA`
   is set but the dashboard template doesn't branch on it (see the
   `app.py`/`CHALLENGE_CODE` note above).

### Frontend

Independent vanilla JS files, one per screen, no bundler: `static/js/login.js`
(mode switch + login POST), `static/js/signup.js` + `webauthn-register.js`
(the 3-step signup wizard: data → face capture → optional FIDO2
registration), `static/js/face.js` (`getUserMedia` capture loop, POSTs a
single JPEG frame per attempt), `static/js/webauthn.js` (manual base64url
encode/decode around `navigator.credentials.create/get`, since the
browser's native `PublicKeyCredential.toJSON()` isn't universally available
yet — this also doubles as an on-screen log of each challenge/response step
for the pedagogical "show your work" requirement).

`compare.html` is the **only** page still extending `base.html` / using
`static/css/style.css` (light corporate-bank theme, navy `#0f2340` + gold
`#a9822f`, no framework). Every other page — `landing.html`, `login.html`,
`signup.html`, `dashboard.html`, `face_auth.html`, `webauthn_auth.html` —
is a standalone HTML document (no `{% extends %}`) built with **Tailwind
CSS via CDN** and **GSAP** (+ **ScrollTrigger** on `landing.html` for the
scroll-driven animation) for a dark/black premium aesthetic, each with its
own inline `<style>` block repeating the same small set of utility classes
(`.glass`, `.grid-fade`, `.glow`, `.text-gradient-gold`, `.status-line`,
`.method-option`, `.camera-frame`) — there's no shared stylesheet or
component system across them by design, so a visual tweak (e.g. the gold
accent color) needs to be repeated in each file that uses it. If you add a
new page, decide explicitly whether it belongs to the dark Tailwind family
or the legacy `base.html`/`style.css` family — don't mix the two within one
template.

The landing page's hero and "tu tarjeta" section both render the same bank
card and phone mockups as pure HTML/CSS/SVG (no images): the card uses a
true CSS 3D box (`.card-box`, 6 faces + a stack of parallel `.card-box__layer`
divs for the visible gold edge — deliberately *not* 4 perpendicular side
walls, which produced visible seams) that GSAP rotates on scroll, and the
phone mockup is a two-face flip (front = home screen, back = card list)
using `backface-visibility: hidden`, also GSAP-rotated. Card network logos
(Visa/Mastercard) are hand-drawn inline SVG shapes, not traced from the
real trademarks — Mastercard's two circles are geometrically simple enough
to reproduce closely, but Visa's wordmark is deliberately *not* on the main
landing card (replaced with the HackerBank hexagon mark) since a redrawn
approximation didn't read well at that size; the dashboard's card list
still shows a redrawn Visa wordmark for the `card.brand == 'Visa'` case.

`CODING_STANDARDS.md` is a general (language-agnostic, mostly
TypeScript/Java-flavored) internal style guide covering clean code, SOLID,
design patterns, and OWASP-style security practices. It's aspirational
background reading, not a description of this Flask codebase — don't
expect e.g. its layered `src/domain`/`src/infrastructure` structure to
match this repo's flat, single-purpose-module layout.

### Public access via ngrok

`python app.py` always tries to expose itself publicly through ngrok
(see `public_tunnel.py` and README's "Acceso público con ngrok"). The
authtoken is never hardcoded — it's resolved at runtime from
`NGROK_AUTHTOKEN` env var first, then from a locally-authenticated ngrok
install's own config as a convenience fallback (Windows Store app path).
If neither is found, the app just runs local-only and says so; it never
crashes for lack of a tunnel.

Two things matter if you touch this:
- `use_reloader=False` is required in `app.run()` — Werkzeug's reloader
  re-execs the whole script in a child process, which would open a
  second ngrok tunnel and usually fail (most ngrok accounts allow only
  one live agent session).
- WebAuthn ties a credential to the exact `origin` it was created under.
  `_expose_publicly_via_ngrok()` in `app.py` overwrites
  `config.WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN` with the tunnel's hostname/URL
  right after opening it — `webauthn_auth.py` reads these as
  `config.WEBAUTHN_RP_ID` (module attribute access, not a copied import),
  so the override takes effect for every request without touching that
  file.

### Known limitation

`static/img/carlos_reference.jpg` ships as a non-face placeholder (see
`README.md`). `seed.py`'s `_seed_carlos_face()` tries to enroll it as
Carlos's face sample via `face_auth.enroll_from_image_path()`; against the
placeholder this fails and just prints a warning telling the instructor to
replace the file and re-run `seed.py` — it does not crash seeding, but it
does mean Carlos has zero enrolled face samples (so Modo A can never
recognize him) until that photo is swapped for a real face before the
event. This is expected, not a bug — don't try to make face detection
succeed against the placeholder itself.
