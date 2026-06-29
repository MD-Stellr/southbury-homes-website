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
var CUSTOM_FIELD_URL = 'https://api.cc.email/v3/contact_custom_fields';

/* Custom fields we want to capture from the inquiry form. CC stores these as
   account-level custom fields referenced by UUID; we look them up by label and
   create any that are missing on first use. CC caps custom-field values at 250
   chars, so long messages are truncated (the full message still reaches the
   team via the Web3Forms email). */
var CUSTOM_FIELDS = [
  { key: 'interest', label: 'Area of Interest' },
  { key: 'message',  label: 'Inquiry Message' }
];

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

/* ---- Resolve custom-field UUIDs by label, creating any that don't exist ----
   The sign_up_form endpoint references custom fields by UUID, so we map our
   labels ("Area of Interest", "Inquiry Message") to the account's field IDs.
   Returns a { key: uuid } map; keys with no resolvable field are omitted. */
async function resolveCustomFields(token) {
  var map = {};
  var r = await fetch(CUSTOM_FIELD_URL + '?limit=100', {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
  });
  var existing = r.ok ? ((await r.json()).custom_fields || []) : [];
  var byLabel = {};
  existing.forEach(function (f) { byLabel[String(f.label || '').toLowerCase()] = f.custom_field_id; });

  for (var i = 0; i < CUSTOM_FIELDS.length; i++) {
    var want = CUSTOM_FIELDS[i];
    var id = byLabel[want.label.toLowerCase()];
    if (!id) {
      var c = await fetch(CUSTOM_FIELD_URL, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ label: want.label, type: 'string' })
      });
      if (c.ok) id = (await c.json()).custom_field_id; // skip silently if create fails (e.g. 25-field cap)
    }
    if (id) map[want.key] = id;
  }
  return map;
}

/* ---- Create/update the contact and add to the list ---- */
async function addContact(token, listId, fields, cf) {
  var payload = { email_address: fields.email, list_memberships: [listId] };

  if (fields.name) {
    var parts = String(fields.name).trim().split(/\s+/);
    payload.first_name = parts.shift();
    if (parts.length) payload.last_name = parts.join(' ');
  }
  // sign_up_form uses the scalar "phone_number" (the array "phone_numbers" is
  // only for the full POST /contacts endpoint) — sending "phone" is ignored.
  if (fields.phone) payload.phone_number = String(fields.phone).trim();

  var customs = [];
  if (cf) {
    if (cf.interest && fields.interest) customs.push({ custom_field_id: cf.interest, value: String(fields.interest).trim().slice(0, 250) });
    if (cf.message && fields.message)  customs.push({ custom_field_id: cf.message,  value: String(fields.message).trim().slice(0, 250) });
  }
  if (customs.length) payload.custom_fields = customs;

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
    // Only resolve custom fields when the submission carries that data (the
    // newsletter form sends neither, so it skips the extra API calls).
    var cf = (b.interest || b.message) ? await resolveCustomFields(token) : {};
    await addContact(token, listId, { email: email, name: b.name, phone: b.phone, interest: b.interest, message: b.message }, cf);
    res.status(200).json({ success: true, stored: true });
  } catch (e) {
    console.error('[subscribe]', e && e.message);
    res.status(502).json({ success: false, error: (e && e.message) || 'error' });
  }
};
