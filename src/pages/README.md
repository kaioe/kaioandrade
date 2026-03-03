# Pages

Route definitions live in `App.tsx`. Each page is a React component in this folder.

## Home (`/`)

- **File:** `Home.tsx`
- **Features:** Bio quote with hyper-text decryption, MorphingCardStack for "Job Done" and "Work in Progress" clients, Prospecting Client popup, theme-aware layout.
- **Navigation:** Header includes link to Professional Summary.

## Professional Summary (`/professional-summary`)

- **File:** `ProfessionalSummary.tsx`
- **Features:** Senior IT Consultant summary — intro, bridge paragraph, "I specialize in" list (cloud, React/Next.js, APIs, Stripe, DevOps, technical planning), strategic guidance paragraph, closing belief. Same visual style as Home (background, glassmorphism card, framer-motion).
- **Rules:** Content is static; specializations are kept in an array for easy edits.
- **Navigation:** "← Kaio Andrade" pill and "← Back to home" link return to Home.

## Fortress Surgical Redirect (`/projects/fortresssurgical`)

- **File:** `FortressSurgicalRedirect.tsx`
- **Features:** Client-side redirect to legacy static project (`/projects/fortresssurgical/index.html`).

---

*Last updated: 2026-03-03*
