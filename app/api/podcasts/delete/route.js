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

    const { sessionId } = body;
    console.log(`🗑️  Delete podcast request`);
    console.log(`   Session ID: ${sessionId}`);

    const response = await makeRequest(
      session.keyPair,
      "/api/record/recordBackup/session/recordsOperation",
      "POST",
      {
        appId: "AI-Podcast",
        sessionId,
        delFlag: 4,
      },
      {
        Authorization: `Bearer ${session.accessToken}`,
      },
      session.accessToken,
    );

    const duration = Date.now() - startTime;
    console.log(`   └─ Status: ${response.status} (${duration}ms)`);

    if (!response.body || response.body.trim() === "") {
      return NextResponse.json({
        code: response.status === 200 ? 200 : 500,
        msg: response.status === 200 ? "success" : "Empty response from server",
        data: response.status === 200,
      });
    }

    const responseData = JSON.parse(response.body);
    console.log(
      `   └─ Parsed: ${responseData.code} - ${responseData.msg}\n`,
    );

    return NextResponse.json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `   ✗ Delete podcast error (${duration}ms):`,
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
