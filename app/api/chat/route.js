import { NextResponse } from 'next/server';
import https from 'https';
import { createDPoPToken } from '@/lib/dpop';
import { deserializeSession, isSessionValid } from '@/lib/session-crypto';

const BASE_URL = 'https://md01.ikkolot.com.cn:12663';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { authSession, model, messageList } = await request.json();

    if (!authSession || !isSessionValid(authSession)) {
      console.log('⚠️  Invalid session attempt');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired session',
        },
        { status: 401 }
      );
    }

    const session = deserializeSession(authSession);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Failed to deserialize session' },
        { status: 401 }
      );
    }

    const userMessage = messageList[messageList.length - 1]?.content?.[0]?.text || '...';
    const preview = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;

    console.log(`💬 Chat request`);
    console.log(`   Model: ${model}`);
    console.log(`   Message: "${preview}"`);

    // Create streaming request
    const url = `${BASE_URL}/api/chat/dialogue/completionsStream`;
    const dpopToken = createDPoPToken(
      session.keyPair.privateKey,
      session.keyPair.publicKey,
      'POST',
      url,
      session.accessToken
    );

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'okhttp/4.12.0',
      DPoP: dpopToken,
      Authorization: `Bearer ${session.accessToken}`,
    };

    const bodyStr = JSON.stringify({
      appId: 'AI-Chat',
      model: model,
      messageList: messageList,
    });

    headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const options = {
      hostname: 'md01.ikkolot.com.cn',
      port: 12663,
      path: '/api/chat/dialogue/completionsStream',
      method: 'POST',
      headers: headers,
      rejectUnauthorized: false,
    };

    // Create a ReadableStream to pipe the response
    const stream = new ReadableStream({
      async start(controller) {
        let bytesReceived = 0;

        const proxyReq = https.request(options, (proxyRes) => {
          console.log(`   └─ Response status: ${proxyRes.statusCode}`);

          proxyRes.on('data', (chunk) => {
            bytesReceived += chunk.length;
            controller.enqueue(chunk);
          });

          proxyRes.on('end', () => {
            const duration = Date.now() - startTime;
            console.log(`   ✓ Stream complete: ${bytesReceived} bytes in ${duration}ms\n`);
            controller.close();
          });

          proxyRes.on('error', (e) => {
            console.error('Proxy response error:', e);
            controller.error(e);
          });
        });

        proxyReq.on('error', (e) => {
          const duration = Date.now() - startTime;
          console.error(`   ✗ Proxy error (${duration}ms):`, e.message, '\n');
          controller.enqueue(Buffer.from(`data: ${JSON.stringify({ error: e.message })}\n\n`));
          controller.close();
        });

        proxyReq.write(bodyStr);
        proxyReq.end();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`   ✗ Chat error (${duration}ms):`, error.message, '\n');

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
