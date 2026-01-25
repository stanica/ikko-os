import { NextResponse } from 'next/server';
import { makeRequest } from '@/lib/api';
import { getSessionFromRequest, unauthorizedResponse } from '@/lib/auth-helper';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const requestBody = await request.json();
    const { session, body: noteData, error } = getSessionFromRequest(requestBody);

    if (error || !session) {
      console.log('⚠️  Invalid session attempt');
      return unauthorizedResponse(error);
    }

    console.log(`📝 Create note request`);
    console.log(`   Title: "${noteData.sessionName}"`);
    console.log(`   Type: ${noteData.taskType}`);

    const response = await makeRequest(
      session.keyPair,
      '/api/record/recordBackup/upload',
      'POST',
      noteData,
      {
        Authorization: `Bearer ${session.accessToken}`,
      },
      session.accessToken
    );

    const duration = Date.now() - startTime;
    console.log(`   └─ Status: ${response.status} (${duration}ms)\n`);

    return NextResponse.json(JSON.parse(response.body));
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`   ✗ Create note error (${duration}ms):`, error.message, '\n');

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
