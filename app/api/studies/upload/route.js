import { NextResponse } from 'next/server';
import https from 'https';
import { createDPoPToken } from '@/lib/dpop';
import { deserializeSession, isSessionValid } from '@/lib/session-crypto';

const BASE_URL = 'https://md01.ikkolot.com.cn:12663';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const authSessionStr = formData.get('authSession');
    const appId = formData.get('appId') || 'AI-Studies';

    let authSession;
    try {
      authSession = JSON.parse(authSessionStr);
    } catch (e) {
      authSession = null;
    }

    if (!authSession || !isSessionValid(authSession)) {
      console.log('⚠️  Invalid session attempt for studies upload');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired session',
        },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    const session = deserializeSession(authSession);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Failed to deserialize session' },
        { status: 401 }
      );
    }

    console.log(`📷 Studies upload request`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const fileName = file.name || 'image.jpg';

    // Create multipart form data boundary
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    // Build multipart body
    let body = '';

    // Add appId field
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="appId"\r\n\r\n`;
    body += `${appId}\r\n`;

    // Add file field (we'll append the binary data separately)
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    body += `Content-Type: application/octet-stream\r\n\r\n`;

    // Create the full body with binary data
    const bodyStart = Buffer.from(body, 'utf-8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullBody = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

    // Create DPoP token
    const url = `${BASE_URL}/api/studies/vision/image/uploadImage`;
    const dpopToken = createDPoPToken(
      session.keyPair.privateKey,
      session.keyPair.publicKey,
      'POST',
      url,
      session.accessToken
    );

    // Make the request
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'md01.ikkolot.com.cn',
        port: 12663,
        path: '/api/studies/vision/image/uploadImage',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBody.length,
          'User-Agent': 'okhttp/4.12.0',
          DPoP: dpopToken,
          Authorization: `Bearer ${session.accessToken}`,
        },
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

      req.on('error', (e) => reject(e));
      req.write(fullBody);
      req.end();
    });

    const duration = Date.now() - startTime;
    console.log(`   └─ Upload status: ${response.status} (${duration}ms)`);

    let responseData;
    try {
      responseData = JSON.parse(response.body);
    } catch (e) {
      responseData = { raw: response.body };
    }

    console.log(`   └─ Response:`, JSON.stringify(responseData).substring(0, 200), '\n');

    return NextResponse.json({
      success: response.status === 200,
      ...responseData,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`   ✗ Studies upload error (${duration}ms):`, error.message, '\n');

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
