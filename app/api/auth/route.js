import { NextResponse } from 'next/server';
import { generateKeyPair } from '@/lib/dpop';
import { makeRequest } from '@/lib/api';
import { serializeSession } from '@/lib/session-crypto';

export async function POST(request) {
  const startTime = Date.now();

  try {
    // Get config from request body (sent from client)
    const body = await request.json().catch(() => ({}));
    const config = {
      deviceImei: body.deviceImei,
      deviceSn: body.deviceSn,
      userEmail: body.userEmail,
      userPassword: body.userPassword,
    };

    console.log('🔐 Starting authentication...');

    // Generate key pair
    console.log('  ├─ Generating EC P-256 key pair...');
    const keyPair = generateKeyPair();

    // Register device
    console.log('  ├─ Registering device...');
    const registerResponse = await makeRequest(
      keyPair,
      '/authApi/auth/registerDeviceKey',
      'POST',
      null,
      {
        'X-Device-Id': config.deviceImei,
        'X-Device-SN': config.deviceSn,
      }
    );
    console.log(`  │  └─ Status: ${registerResponse.status}`);

    const registerData = JSON.parse(registerResponse.body);
    console.log(`  │  └─ Response: ${registerData.code} - ${registerData.msg}`);

    if (registerData.code !== 200) {
      throw new Error(`Device registration failed: ${registerData.msg}`);
    }

    // Login
    console.log('  ├─ Logging in user...');
    const loginResponse = await makeRequest(
      keyPair,
      '/authApi/auth/login',
      'POST',
      {
        account: config.userEmail,
        password: config.userPassword,
        app: 'phone_control',
      },
      {
        'X-Device-Id': config.deviceImei,
        'X-Device-SN': config.deviceSn,
      }
    );
    console.log(`  │  └─ Status: ${loginResponse.status}`);

    const loginData = JSON.parse(loginResponse.body);
    console.log(`  │  └─ Response: ${loginData.code} - ${loginData.msg}`);

    if (loginData.code !== 200 || !loginData.data?.accessToken) {
      throw new Error(loginData.msg || 'Login failed - no access token');
    }

    const accessToken = loginData.data.accessToken;
    const expiresIn = loginData.data.expiresIn;

    // Serialize session for client storage
    const sessionData = serializeSession(keyPair, accessToken, expiresIn);

    const duration = Date.now() - startTime;
    console.log(`  └─ ✓ Session created (${duration}ms)`);
    console.log(`     Token expires in: ${expiresIn}s\n`);

    return NextResponse.json({
      success: true,
      session: sessionData,
      expiresIn,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`  └─ ✗ Authentication failed (${duration}ms):`, error.message, '\n');

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
