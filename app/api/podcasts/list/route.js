import { NextResponse } from "next/server";
import { makeRequest } from "@/lib/api";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth-helper";

export async function POST(request) {
  const startTime = Date.now();

  try {
    const requestBody = await request.json();
    const { session, body, error } = getSessionFromRequest(requestBody);

    if (error || !session) {
      console.log("⚠️  Invalid session attempt");
      return unauthorizedResponse(error);
    }

    const { delFlag, limit, offset } = body;
    console.log("🎙️ Podcast list request");

    const response = await makeRequest(
      session.keyPair,
      "/api/record/recordBackup/session/list",
      "POST",
      {
        appId: "AI-Podcast",
        delFlag: delFlag || 0,
        limit: limit || 50,
        offset: offset || 0,
      },
      {
        Authorization: `Bearer ${session.accessToken}`,
      },
      session.accessToken,
    );

    const duration = Date.now() - startTime;
    const responseData = JSON.parse(response.body);
    console.log(`   └─ Status: ${response.status} (${duration}ms)\n`);

    return NextResponse.json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `   ✗ Podcast list error (${duration}ms):`,
      error.message,
      "\n",
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
