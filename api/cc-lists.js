/* =========================================================
   SOUTHBURY HOMES — Constant Contact list viewer (setup aid)
   ---------------------------------------------------------
   After connecting (/api/cc-connect), visit /api/cc-lists in a
   browser to see every Constant Contact list with its ID, so you
   can copy the IDs into the CC_LIST_INQUIRY / CC_LIST_NEWSLETTER
   env vars. Read-only; safe to leave in place.
   ========================================================= */

var TOKEN_URL = 'https://authz.constantcontact.com/oauth2/default/v1/token';
var LISTS_URL = 'https://api.cc.email/v3/contact_lists?include_count=true';
var RT_KEY = 'cc:refresh_token';

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

async function getAccessToken() {
  var refresh = await kv(['GET', RT_KEY]);
  if (!refresh) throw new Error('not_connected');
  var basic = Buffer.from(process.env.CC_CLIENT_ID + ':' + process.env.CC_CLIENT_SECRET).toString('base64');
  var r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + basic, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: refresh, grant_type: 'refresh_token' })
  });
  if (!r.ok) throw new Error('token_refresh_failed_' + r.status);
  var d = await r.json();
  if (d.refresh_token) await kv(['SET', RT_KEY, d.refresh_token]);
  return d.access_token;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  try {
    var token = await getAccessToken();
    var r = await fetch(LISTS_URL, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } });
    var d = await r.json();
    var lists = (d && d.lists) || [];

    var rows = lists.map(function (l) {
      return '<tr><td style="padding:.4rem .9rem">' + (l.name || '') +
        '</td><td style="padding:.4rem .9rem"><code>' + l.list_id + '</code></td>' +
        '<td style="padding:.4rem .9rem">' + (l.membership_count != null ? l.membership_count : '') + '</td></tr>';
    }).join('');

    res.status(200).send(
      '<!doctype html><meta charset="utf-8"><title>CC lists</title>' +
      '<body style="font-family:system-ui;max-width:46rem;margin:8vh auto;padding:0 1.5rem;color:#1c1b17">' +
      '<h1 style="font-weight:600">Constant Contact lists</h1>' +
      '<p>Copy the ID of the list you want into the matching env var ' +
      '(<code>CC_LIST_INQUIRY</code> / <code>CC_LIST_NEWSLETTER</code>), then redeploy.</p>' +
      '<table style="border-collapse:collapse;font-size:.95rem"><thead><tr>' +
      '<th style="text-align:left;padding:.4rem .9rem">List</th>' +
      '<th style="text-align:left;padding:.4rem .9rem">ID</th>' +
      '<th style="text-align:left;padding:.4rem .9rem">Contacts</th></tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="3" style="padding:.4rem .9rem">No lists yet — create one in Constant Contact first.</td></tr>') +
      '</tbody></table></body>'
    );
  } catch (e) {
    var msg = (e && e.message) === 'not_connected'
      ? 'Not connected yet. Visit <a href="/api/cc-connect">/api/cc-connect</a> first.'
      : 'Error: ' + (e && e.message);
    res.status(200).send('<body style="font-family:system-ui;margin:8vh auto;max-width:40rem;padding:0 1.5rem">' + msg + '</body>');
  }
};
