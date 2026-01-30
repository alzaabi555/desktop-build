const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.exchangeGoogleCode = functions.https.onRequest(async (req, res) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

    const { code, codeVerifier, redirectUri } = req.body || {};
    if (!code || !codeVerifier || !redirectUri) {
      return res.status(400).json({ error: "Missing code/codeVerifier/redirectUri" });
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing GOOGLE_OAUTH_CLIENT_ID/SECRET" });
    }

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: redirectUri
      })
    });

    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok) {
      return res.status(400).json({ error: "Google token exchange failed", details: tokenJson });
    }

    const idToken = tokenJson.id_token;
    if (!idToken) return res.status(400).json({ error: "No id_token" });

    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString("utf8"));
    const googleSub = payload.sub;
    const email = payload.email || null;
    if (!googleSub) return res.status(400).json({ error: "Invalid id_token payload" });

    const uid = `google:${googleSub}`;
    const firebaseCustomToken = await admin.auth().createCustomToken(uid, { provider: "google", email }); // mint on server [web:209]

    return res.json({ firebaseCustomToken });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});
