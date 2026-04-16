# Shadowban Checker

Aesthetic dark React + Express project for checking **real X profile data** and showing a **soft visibility indicator**.

## What is real here
- Profile image
- Display name
- Username
- Bio
- Followers count
- Following count
- Posts count

Those profile values are fetched live from the backend through the X API user lookup route.

## What is not absolute
The "shadowban" result is still only an **indicator**, not a final verdict. The UI intentionally treats it as a soft signal because visibility issues on X are not something a normal frontend can prove with 100% certainty.

## Stack
- Frontend: React + Vite
- Backend: Express
- Styling: plain CSS

## Project structure
```text
shadowban-checker-project/
├── backend/
├── frontend/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Setup
1. Copy `.env.example` to `.env` at the project root.
2. Put your X API bearer token into `X_BEARER_TOKEN`.
3. Install dependencies:
   ```bash
   npm install
   npm run install:all
   ```
4. Run both apps:
   ```bash
   npm run dev
   ```

Frontend will run on Vite's dev server. Backend defaults to `http://localhost:8787`.

## Backend route
### GET `/api/profile/:username`
Returns a normalized profile payload.

Example response:
```json
{
  "ok": true,
  "profile": {
    "id": "2244994945",
    "name": "X Dev",
    "username": "XDevelopers",
    "description": "The voice of the X Dev team and your official source for updates...",
    "avatarUrl": "https://...",
    "followers": 123456,
    "following": 789,
    "posts": 4567,
    "verified": false,
    "createdAt": "2013-12-14T04:35:55.000Z"
  }
}
```

## Notes
- The backend expects an X API bearer token.
- If a user is suspended, unavailable, or your token access is insufficient, the API may return an error.
- Profile counts can change at any moment, so the page reflects the numbers returned at request time.

## GitHub upload steps
```bash
git init
git add .
git commit -m "Initial shadowban checker project"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

## Optional deployment idea
- Frontend: Vercel / Netlify
- Backend: Render / Railway / VPS

If you deploy them separately, set `VITE_API_BASE_URL` to your backend URL.
