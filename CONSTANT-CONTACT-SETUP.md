# Constant Contact integration — setup walkthrough

The website forms (contact inquiry + footer newsletter) add contacts to
Constant Contact and trigger a "thank you" Welcome Email. **The code is done.**
The steps below are the one-time account setup, in order. Anyone with access to
the Constant Contact and Vercel accounts can follow them — no coding.

Plan ~30 minutes. Do the steps in order; a few depend on the previous one.

---

## How it works (for reference)

```
Form submit
  ├─ /api/subscribe  → Constant Contact  → contact added to a list
  │                                        → CC Welcome Email sends the thank-you
  └─ (contact form only) Web3Forms        → inquiry emailed to the team  [unchanged]
```

Helper pages you'll use during setup:
- `/api/cc-connect` — visit once to authorize the site against your CC account.
- `/api/cc-lists` — shows your CC lists + their IDs (so you can copy them).

---

## Step 1 — Create the Constant Contact developer app

1. Go to **https://developer.constantcontact.com** and click **Sign in** (top right).
   Use the **same login as your normal Constant Contact account**.
2. In the top menu click **My Applications**, then the **New Application** button.
3. Name it `Southbury Homes Website` and create it.
4. You'll land on the app's page. Note two things:
   - **API Key** — this is your **Client ID**. Copy it somewhere.
   - **App Secret** — click **Generate Secret**, then **copy it immediately**
     (it's only shown once). This is your **Client Secret**.
5. Find the **Redirect URI** box (may be called "App's Allowed Redirect URIs").
   Add this exact URL and save:
   ```
   https://YOUR-LIVE-DOMAIN/api/cc-connect
   ```
   Replace `YOUR-LIVE-DOMAIN` with the site's real address. To find it: Vercel
   dashboard → this project → **Domains**. Use the custom domain if there is one
   (e.g. `southburyhomes.ca`), otherwise the `…vercel.app` URL. It must match
   **exactly**, including `https://` and no trailing slash.

> Keep the API Key and App Secret handy — you'll paste them in Step 3.

---

## Step 2 — Create a Vercel KV store

This is where the login token is safely kept.

1. Vercel dashboard → open this project → **Storage** tab.
2. Click **Create Database** → choose **KV** (Redis / "Upstash"). Give it any name
   and create it. When asked, **connect it to this project**.
3. That automatically adds the storage env vars (named either `KV_REST_API_URL` /
   `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` / `…TOKEN`). Either naming
   works — you don't need to touch them.

---

## Step 3 — Add the Constant Contact env vars

1. Vercel project → **Settings** → **Environment Variables**.
2. Add these two (click "Add" for each, leave all environments checked):

   | Name               | Value                          |
   |--------------------|--------------------------------|
   | `CC_CLIENT_ID`     | the **API Key** from Step 1    |
   | `CC_CLIENT_SECRET` | the **App Secret** from Step 1 |

   (You'll add the two `CC_LIST_…` vars in Step 6 — skip them for now.)
3. **Redeploy** so the vars take effect: Vercel → **Deployments** → the latest one →
   the **⋯** menu → **Redeploy**.

---

## Step 4 — Connect the site to Constant Contact (one time)

1. In a browser, go to **`https://YOUR-LIVE-DOMAIN/api/cc-connect`**.
2. You'll be sent to Constant Contact — log in and click **Allow**.
3. You should land back on a page that says **"Constant Contact connected ✓"**.

That stores the login token. If you see an error about the redirect URI, the URL
in Step 1.5 doesn't exactly match the domain you're visiting — fix it and retry.

---

## Step 5 — Create your list(s) in Constant Contact

1. Go to **https://app.constantcontact.com** → **Contacts** → **Lists**.
2. Create the list(s) you want website signups to land in. Either:
   - **One list** for everything (simplest), or
   - **Two lists**, e.g. `Website Inquiries` and `New Release Newsletter`.

---

## Step 6 — Get the list IDs and add them as env vars

1. In a browser, go to **`https://YOUR-LIVE-DOMAIN/api/cc-lists`**.
   It shows a table of every list with its **ID**.
2. Back in Vercel → **Settings** → **Environment Variables**, add:

   | Name                 | Value                                    |
   |----------------------|------------------------------------------|
   | `CC_LIST_INQUIRY`    | ID of the list for contact-form leads    |
   | `CC_LIST_NEWSLETTER` | ID of the list for newsletter signups    |

   (Using one list? Paste the **same ID** into both.)
3. **Redeploy** again (Step 3.3).

The forms are now live — submissions create contacts in Constant Contact.

---

## Step 7 — Write the thank-you email (in Constant Contact)

The thank-you email is built in Constant Contact, not in code, so you control the
wording and design.

1. In Constant Contact, go to **Automations** (or **Campaigns → Automations**).
2. Create a **Welcome Email** automation, set to trigger **when a contact joins**
   your list (do this for each list you used).
3. Write the *"Thank you for your interest in Southbury Homes…"* copy and turn it
   on. Constant Contact sends it automatically to every new signup.

---

## Testing & notes

- **Test it:** submit the footer newsletter form on the live site with a real
  email, then check that the contact appears in the Constant Contact list and the
  welcome email arrives (check spam too).
- **Local preview** (`python3 -m http.server`) **cannot run the `/api` pages** —
  test on the live Vercel site (or use `vercel dev`).
- Before setup is finished, the forms still show their thank-you message but don't
  store anything — so the site is never broken mid-setup. After setup, any real
  failures show up in **Vercel → your project → the function's Logs**.
- The contact form keeps emailing the team via Web3Forms regardless of CC status.
- Secrets live only in Vercel env vars — never commit them.
- If the live domain ever changes, update the Redirect URI in the CC app (Step 1.5)
  and re-run **Step 4**.
