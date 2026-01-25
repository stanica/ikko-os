// DPoP Token Generation Utilities
const crypto = require('crypto');

// Generate EC P-256 key pair for DPoP
function generateKeyPair() {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });
}

// Export public key as JWK
function getPublicKeyJWK(publicKey) {
  const jwk = publicKey.export({ format: 'jwk' });
  return {
    kty: 'EC',
    use: 'sig',
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
    alg: 'ES256',
  };
}

// Create DPoP token
function createDPoPToken(privateKey, publicKey, method, url, accessToken = null) {
  const jwk = getPublicKeyJWK(publicKey);

  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk: jwk,
  };

  const payload = {
    htm: method,
    htu: url,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  };

  if (accessToken) {
    const hash = crypto
      .createHash('sha256')
      .update(accessToken)
      .digest('base64url');
    payload.ath = hash;
  }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${headerB64}.${payloadB64}`;

  const signature = crypto.sign(null, Buffer.from(signatureInput), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });

  const signatureB64 = signature.toString('base64url');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

module.exports = {
  generateKeyPair,
  getPublicKeyJWK,
  createDPoPToken,
};
