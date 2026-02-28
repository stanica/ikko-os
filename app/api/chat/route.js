import { NextResponse } from 'next/server';
import https from 'https';
import { createDPoPToken } from '@/lib/dpop';
import { deserializeSession, isSessionValid } from '@/lib/session-crypto';

const HOSTS = [
  { hostname: 'md01.ikkolot.com.cn', url: 'https://md01.ikkolot.com.cn:12663' },
  { hostname: 'md01cn.ikkolot.com.cn', url: 'https://md01cn.ikkolot.com.cn:12663' },
];

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

    const path = '/api/chat/dialogue/completionsStream';
    const bodyStr = JSON.stringify({
      appId: 'AI-Chat',
      model: model,
      messageList: messageList,
    });

    // Try each host with fallback
    const tryHost = (hostIndex) => {
      const host = HOSTS[hostIndex];
      const url = `${host.url}${path}`;
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
        'Content-Length': Buffer.byteLength(bodyStr),
      };

      return new ReadableStream({
        async start(controller) {
          let bytesReceived = 0;

          const options = {
            hostname: host.hostname,
            port: 12663,
            path,
            method: 'POST',
            headers,
            rejectUnauthorized: false,
          };

          console.log(`   Trying ${host.hostname}...`);

          const proxyReq = https.request(options, (proxyRes) => {
            console.log(`   └─ ${host.hostname} responded: ${proxyRes.statusCode}`);

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
              console.error(`   Proxy response error (${host.hostname}):`, e);
              controller.error(e);
            });
          });

          proxyReq.on('error', (e) => {
            console.error(`   ✗ ${host.hostname} failed: ${e.message}`);
            if (hostIndex + 1 < HOSTS.length) {
              console.log(`   Falling back to ${HOSTS[hostIndex + 1].hostname}...`);
              // Pipe fallback stream into this controller
              const fallbackStream = tryHost(hostIndex + 1);
              const reader = fallbackStream.getReader();
              const pump = () => reader.read().then(({ done, value }) => {
                if (done) { controller.close(); return; }
                controller.enqueue(value);
                pump();
              }).catch(err => controller.error(err));
              pump();
            } else {
              controller.enqueue(Buffer.from(`data: ${JSON.stringify({ error: e.message })}\n\n`));
              controller.close();
            }
          });

          proxyReq.write(bodyStr);
          proxyReq.end();
        },
      });
    };

    return new Response(tryHost(0), {
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
