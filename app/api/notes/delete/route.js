import { NextResponse } from 'next/server';
import { makeRequest } from '@/lib/api';
import { getSessionFromRequest, unauthorizedResponse } from '@/lib/auth-helper';

export async function POST(request) {
  console.log('🗑️  Delete route hit');
  const startTime = Date.now();

  try {
    const requestBody = await request.json();
    console.log('🗑️  Request body received');
    const { session, body, error } = getSessionFromRequest(requestBody);

    if (error || !session) {
      console.log('⚠️  Invalid session attempt');
      return unauthorizedResponse(error);
    }

    const { sessionId: noteSessionId } = body;
    console.log(`🗑️  Delete note request`);
    console.log(`   Note Session ID: ${noteSessionId}`);

    const response = await makeRequest(
      session.keyPair,
      '/api/record/recordBackup/session/recordsOperation',
      'POST',
      {
        appId: 'AI-Meetings',
        sessionId: noteSessionId,
        delFlag: 4,
      },
      {
        Authorization: `Bearer ${session.accessToken}`,
      },
      session.accessToken
    );

    const duration = Date.now() - startTime;
    console.log(`   └─ Status: ${response.status} (${duration}ms)`);
    console.log(`   └─ Raw response: ${response.body.substring(0, 500)}`);

    if (!response.body || response.body.trim() === '') {
      console.log(`   └─ Empty response body\n`);
      return NextResponse.json({
        code: response.status === 200 ? 200 : 500,
        msg: response.status === 200 ? 'success' : 'Empty response from server',
        data: response.status === 200,
      });
    }

    const responseData = JSON.parse(response.body);
    console.log(`   └─ Parsed: ${responseData.code} - ${responseData.msg}\n`);

    return NextResponse.json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`   ✗ Delete note error (${duration}ms):`, error.message, '\n');

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
