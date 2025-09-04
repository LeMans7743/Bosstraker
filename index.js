// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendPush = functions.https.onRequest(async (req, res) => {
  // 安全性強烈建議：在此檢查請求授權（例如檢查 req.headers.authorization 與你的秘密）
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { token, title, body, data } = req.body;
  if (!token) return res.status(400).send('Missing token');

  try {
    const message = {
      token: token,
      notification: {
        title: title || 'BOSS已重生',
        body: body || ''
      },
      data: data || {}
    };
    const result = await admin.messaging().send(message);
    console.log('Sent message:', result);
    return res.status(200).send({ success: true, result });
  } catch (err) {
    console.error('Error sending message', err);
    return res.status(500).send({ error: err.message });
  }
});
