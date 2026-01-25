import { NextResponse } from 'next/server';
import { makeRequest } from '@/lib/api';
import { getSessionFromRequest, unauthorizedResponse } from '@/lib/auth-helper';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const requestBody = await request.json();
    const { session, body, error } = getSessionFromRequest(requestBody);

    if (error || !session) {
      console.log('⚠️  Invalid session attempt');
      return unauthorizedResponse(error);
    }

    const { sessionId: noteSessionId } = body;
    console.log(`📝 Note details request`);
    console.log(`   Note Session ID: ${noteSessionId}`);

    const response = await makeRequest(
      session.keyPair,
      '/api/record/recordBackup/session/queryRecords',
      'POST',
      {
        sessionId: noteSessionId,
      },
      {
        Authorization: `Bearer ${session.accessToken}`,
      },
      session.accessToken
    );

    const duration = Date.now() - startTime;
    const responseData = JSON.parse(response.body);
    console.log(`   └─ Status: ${response.status} (${duration}ms)`);
    console.log(`   🔍 Number of records: ${responseData.data?.length || 0}\n`);

    return NextResponse.json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`   ✗ Note details error (${duration}ms):`, error.message, '\n');

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
