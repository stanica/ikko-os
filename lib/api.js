// Ikko API request utility
const https = require('https');
const { createDPoPToken } = require('./dpop');

const BASE_URL = 'https://md01.ikkolot.com.cn:12663';

// Make HTTPS request with DPoP
function makeRequest(keyPair, path, method, body = null, extraHeaders = {}, accessToken = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const dpopToken = createDPoPToken(
      keyPair.privateKey,
      keyPair.publicKey,
      method,
      url,
      accessToken
    );

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'okhttp/4.12.0',
      DPoP: dpopToken,
      ...extraHeaders,
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const options = {
      hostname: 'md01.ikkolot.com.cn',
      port: 12663,
      path: path,
      method: method,
      headers: headers,
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Make streaming request (returns the response object for piping)
function makeStreamingRequest(keyPair, path, method, body, accessToken) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const dpopToken = createDPoPToken(
      keyPair.privateKey,
      keyPair.publicKey,
      method,
      url,
      accessToken
    );

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'okhttp/4.12.0',
      DPoP: dpopToken,
      Authorization: `Bearer ${accessToken}`,
    };

    const bodyStr = JSON.stringify(body);
    headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const options = {
      hostname: 'md01.ikkolot.com.cn',
      port: 12663,
      path: path,
      method: method,
      headers: headers,
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      resolve(res);
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(bodyStr);
    req.end();
  });
}

module.exports = {
  BASE_URL,
  makeRequest,
  makeStreamingRequest,
};
