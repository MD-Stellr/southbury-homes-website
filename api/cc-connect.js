/* =========================================================
   SOUTHBURY HOMES — Constant Contact one-time connect
   ---------------------------------------------------------
   Visit https://<your-domain>/api/cc-connect ONCE in a browser.
   It sends you to Constant Contact to log in + authorize, then
   Constant Contact redirects back here with a code, which we
   exchange for a refresh token and store in Vercel KV. After
   that, /api/subscribe can add contacts indefinitely.

   The redirect URI registered in your Constant Contact app must
   exactly match:  https://<your-domain>/api/cc-connect
   ========================================================= */

var AUTHORIZE_URL = 'https://authz.constantcontact.com/oauth2/default/v1/authorize';
var TOKEN_URL = 'https://authz.constantcontact.com/oauth2/default/v1/token';
var RT_KEY = 'cc:refresh_token';

module.exports = async function handler(req, res) {
  var clientId = process.env.CC_CLIENT_ID;
  var clientSecret = process.env.CC_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send('Missing CC_CLIENT_ID / CC_CLIENT_SECRET environment variables.');
    return;
  }

  var proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  var redirectUri = proto + '://' + req.headers.host + '/api/cc-connect';
  var code = req.query && req.query.code;

  /* Step 1 — no code yet: bounce to Constant Contact's consent screen. */
  if (!code) {
    var authUrl = AUTHORIZE_URL +
      '?client_id=' + encodeURIComponent(clientId) +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&response_type=code' +
      '&scope=' + encodeURIComponent('contact_data offline_access') +
      '&state=southbury';
    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  }

  /* Step 2 — exchange the code for tokens and store the refresh token. */
  try {
    var basic = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    var r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + basic, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: code, redirect_uri: redirectUri, grant_type: 'authorization_code' })
    });
    var d = await r.json();
    if (!d.refresh_token) {
      res.status(500).send('No refresh token returned by Constant Contact: ' + JSON.stringify(d));
      return;
    }

    var kvApiUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    var kvApiToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    await fetch(kvApiUrl, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + kvApiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', RT_KEY, d.refresh_token])
    });

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(
      '<!doctype html><meta charset="utf-8"><title>Connected</title>' +
      '<body style="font-family:system-ui;max-width:34rem;margin:18vh auto;padding:0 1.5rem;color:#1c1b17">' +
      '<h1 style="font-weight:600">Constant Contact connected &#10003;</h1>' +
      '<p>The Southbury Homes website can now add contacts to Constant Contact. ' +
      'You can close this tab.</p></body>'
    );
  } catch (e) {
    res.status(500).send('Connect failed: ' + (e && e.message));
  }
};
