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

// Make multipart request for file uploads
function makeMultipartRequest(keyPair, path, method, fields, fileField, accessToken) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const dpopToken = createDPoPToken(
      keyPair.privateKey,
      keyPair.publicKey,
      method,
      url,
      accessToken
    );

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const parts = [];

    // Add text fields
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        parts.push(
          `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
            `${value}`
        );
      }
    }

    // Add file field if present
    if (fileField) {
      parts.push(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\n` +
          `Content-Type: ${fileField.contentType}\r\n\r\n`
      );
    }

    // Build the body buffer
    let bodyBuffer;
    if (fileField) {
      // With file: header + file data + footer
      const header = Buffer.from(parts.join('\r\n') + (parts.length > 1 ? '' : ''));
      const fileBuffer = Buffer.from(fileField.data);
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      bodyBuffer = Buffer.concat([header, fileBuffer, footer]);
    } else {
      // Without file: just text fields + closing boundary
      const body = parts.join('\r\n') + `\r\n--${boundary}--\r\n`;
      bodyBuffer = Buffer.from(body);
    }

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
      'User-Agent': 'okhttp/4.12.0',
      DPoP: dpopToken,
      Authorization: `Bearer ${accessToken}`,
    };

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

    req.write(bodyBuffer);
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
  makeMultipartRequest,
  makeStreamingRequest,
};
