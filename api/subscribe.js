/* =========================================================
   SOUTHBURY HOMES — Constant Contact subscribe endpoint
   ---------------------------------------------------------
   The website forms POST here (JSON). We exchange the stored
   Constant Contact refresh token for an access token, then
   add/update the contact in the appropriate CC list. The
   per-list "Welcome Email" automation (configured in the CC
   dashboard) sends the "thank you for your interest" email.

   No npm dependencies — Node 18+ globals only (fetch, Buffer,
   URLSearchParams). Token storage is Vercel KV (Upstash REST).
   ========================================================= */

var RT_KEY = 'cc:refresh_token';

var TOKEN_URL = 'https://authz.constantcontact.com/oauth2/default/v1/token';
var SIGNUP_URL = 'https://api.cc.email/v3/contacts/sign_up_form';

/* ---- Vercel KV (Upstash Redis REST, command-array form) ----
   Accept either env-var naming Vercel may provide depending on how the
   store was created (classic "KV_*" or the Upstash marketplace "UPSTASH_*"). */
function kvUrl() { return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL; }
function kvToken() { return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN; }

async function kv(command) {
  var r = await fetch(kvUrl(), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + kvToken(), 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  var d = await r.json();
  return d.result;
}

/* ---- Get a valid access token; persist the rotated refresh token ---- */
async function getAccessToken() {
  var refresh = await kv(['GET', RT_KEY]);
  if (!refresh) throw new Error('not_connected'); // run the one-time /api/cc-connect first

  var basic = Buffer.from(process.env.CC_CLIENT_ID + ':' + process.env.CC_CLIENT_SECRET).toString('base64');
  var r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + basic, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: refresh, grant_type: 'refresh_token' })
  });
  if (!r.ok) throw new Error('token_refresh_failed_' + r.status);
  var d = await r.json();

  // Constant Contact rotates the refresh token on every use — store the new one.
  if (d.refresh_token) await kv(['SET', RT_KEY, d.refresh_token]);
  return d.access_token;
}

/* ---- Create/update the contact and add to the list ---- */
async function addContact(token, listId, fields) {
  var payload = { email_address: fields.email, list_memberships: [listId] };

  if (fields.name) {
    var parts = String(fields.name).trim().split(/\s+/);
    payload.first_name = parts.shift();
    if (parts.length) payload.last_name = parts.join(' ');
  }
  if (fields.phone) payload.phone = String(fields.phone).trim();

  var r = await fetch(SIGNUP_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('cc_signup_failed_' + r.status);
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ success: false, error: 'method_not_allowed' }); return; }

  var b = req.body || {};
  if (b.botcheck) { res.status(200).json({ success: true }); return; } // honeypot — pretend success

  var email = (b.email || '').trim();
  if (!email) { res.status(400).json({ success: false, error: 'email_required' }); return; }

  var listMap = {
    inquiry: process.env.CC_LIST_INQUIRY,
    newsletter: process.env.CC_LIST_NEWSLETTER
  };
  var listId = listMap[b.list] || process.env.CC_LIST_NEWSLETTER;

  // Not configured yet (env/KV/list missing) → stay graceful so the form UX
  // never breaks before the backend is fully wired up.
  if (!process.env.CC_CLIENT_ID || !kvUrl() || !listId) {
    res.status(200).json({ success: true, stored: false, reason: 'not_configured' });
    return;
  }

  try {
    var token = await getAccessToken();
    await addContact(token, listId, { email: email, name: b.name, phone: b.phone });
    res.status(200).json({ success: true, stored: true });
  } catch (e) {
    console.error('[subscribe]', e && e.message);
    res.status(502).json({ success: false, error: (e && e.message) || 'error' });
  }
};
