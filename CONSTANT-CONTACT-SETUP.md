# Constant Contact integration — setup

The website forms (contact inquiry + footer newsletter) add contacts to
Constant Contact and trigger a "thank you" Welcome Email. The code is done;
the steps below are the one-time account setup (most of it can only be done by
someone with access to the Constant Contact + Vercel accounts).

## How it works

```
Form submit
  ├─ /api/subscribe  → Constant Contact  → contact added to a list
  │                                        → CC "Welcome Email" automation sends the thank-you
  └─ (contact form only) Web3Forms        → inquiry emailed to the team  [unchanged]
```

- `api/subscribe.js` — endpoint the forms POST to. Refreshes a CC access token and adds the contact.
- `api/cc-connect.js` — visit once in a browser to authorize the site against the CC account.
- Token storage = **Vercel KV** (CC refresh tokens rotate on every use and must be persisted).
- The thank-you email is **not in code** — it's a Welcome Email automation you build in the CC dashboard, one per list.

---

## One-time setup checklist

### 1. Create a Constant Contact developer app
1. Go to <https://developer.constantcontact.com> → My Applications → New Application.
2. Set the **Redirect URI** to exactly: `https://southburyhomes.ca/api/cc-connect`
   (use the real production domain; add the Vercel preview URL too if you'll test there).
3. Copy the **API Key (client ID)** and generate/copy the **App Secret (client secret)**.

### 2. Find your list ID(s)
In Constant Contact → Contacts → Lists. Create (or pick) the list(s) for website
signups. You can use one list for everything or two (e.g. "Website Inquiries" and
"New Release Newsletter"). You'll need each list's **ID**.

### 3. Create a Vercel KV store
Vercel dashboard → this project → Storage → Create → **KV**. Connect it to the
project. This auto-adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars.

### 4. Add environment variables (Vercel → Settings → Environment Variables)
| Variable             | Value                                   |
|----------------------|-----------------------------------------|
| `CC_CLIENT_ID`       | API Key from step 1                     |
| `CC_CLIENT_SECRET`   | App Secret from step 1                  |
| `CC_LIST_INQUIRY`    | list ID for contact-form leads          |
| `CC_LIST_NEWSLETTER` | list ID for newsletter signups          |

(`KV_REST_API_URL` / `KV_REST_API_TOKEN` were added automatically in step 3.)
Redeploy so the new env vars take effect.

### 5. Connect the account (one time)
Visit **`https://southburyhomes.ca/api/cc-connect`** in a browser. Log into
Constant Contact and approve. You should see "Constant Contact connected ✓".
That stores the refresh token in KV; the forms are now live.

### 6. Build the thank-you emails (in Constant Contact)
For each list, in CC → Marketing/Automations → create a **Welcome Email**
triggered when a contact joins that list. Write the "Thank you for your interest…"
copy there. CC sends it automatically on each new signup.

---

## Notes
- **Local preview** (`python3 -m http.server`) cannot run the `/api` functions.
  To test the CC path locally use `vercel dev`, or just test on a Vercel
  preview/production deploy.
- Until step 5 is done, `/api/subscribe` responds gracefully (the form still
  shows its thank-you message) but no contact is stored — so the site is never
  broken mid-setup. Real errors after setup are visible in the Vercel function logs.
- The contact form keeps emailing the team via Web3Forms regardless of CC status.
- Secrets live only in Vercel env vars — never commit them. `.env.example` lists
  the names for reference.
