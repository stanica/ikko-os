import { NextResponse } from "next/server";
import { makeMultipartRequest } from "@/lib/api";
import { deserializeSession, isSessionValid } from "@/lib/session-crypto";

export async function POST(request) {
  const startTime = Date.now();

  try {
    const contentType = request.headers.get("content-type") || "";
    let session, textContent, urlContent, fileData, fileName;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (file uploads)
      const formData = await request.formData();
      const authSessionStr = formData.get("authSession");

      // Parse the JSON string from FormData
      let authSession;
      try {
        authSession = authSessionStr ? JSON.parse(authSessionStr) : null;
      } catch (e) {
        console.log("⚠️  Failed to parse authSession:", e.message);
        return NextResponse.json(
          { success: false, error: "Invalid session format" },
          { status: 401 },
        );
      }

      if (!authSession || !isSessionValid(authSession)) {
        console.log("⚠️  Invalid session attempt");
        return NextResponse.json(
          { success: false, error: "Invalid or expired session" },
          { status: 401 },
        );
      }

      session = deserializeSession(authSession);
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Failed to deserialize session" },
          { status: 401 },
        );
      }

      textContent = formData.get("text");
      urlContent = formData.get("url");

      const file = formData.get("file");
      if (file && file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        fileData = new Uint8Array(arrayBuffer);
        fileName = file.name || "podcast.pdf";
        console.log("🎙️ Podcast generate request with PDF:", fileName);
      }
    } else {
      // Handle JSON
      const requestBody = await request.json();
      const { authSession, ...body } = requestBody;

      if (!authSession || !isSessionValid(authSession)) {
        console.log("⚠️  Invalid session attempt");
        return NextResponse.json(
          { success: false, error: "Invalid or expired session" },
          { status: 401 },
        );
      }

      session = deserializeSession(authSession);
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Failed to deserialize session" },
          { status: 401 },
        );
      }

      const sources = body.sources || [];
      console.log(
        "🎙️ Podcast generate request with",
        sources.length,
        "sources",
      );

      // Extract source data
      for (const source of sources) {
        if (source.type === "text" && source.content) {
          textContent = textContent
            ? `${textContent}\n\n${source.content}`
            : source.content;
        } else if (source.type === "website" && source.content) {
          if (!urlContent) {
            urlContent = source.content;
          }
        }
      }
    }

    // Validate we have at least one source
    if (!textContent && !urlContent && !fileData) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one source (text, URL, or PDF) is required",
        },
        { status: 400 },
      );
    }

    // Android app always uses multipart - only sends: file, url, text, language
    console.log("   └─ Calling /api/podcast/generation/start with multipart");
    console.log(
      "   └─ Has text:",
      !!textContent,
      "Has URL:",
      !!urlContent,
      "Has file:",
      !!fileData,
    );

    const fields = {
      language: "en",
    };
    if (textContent) fields.text = textContent;
    if (urlContent) fields.url = urlContent;

    const response = await makeMultipartRequest(
      session.keyPair,
      "/api/podcast/generation/start",
      "POST",
      fields,
      fileData
        ? {
            name: "file",
            filename: fileName,
            contentType: "application/pdf",
            data: fileData,
          }
        : null,
      session.accessToken,
    );

    const duration = Date.now() - startTime;
    let responseData;

    try {
      responseData = JSON.parse(response.body);
    } catch (e) {
      responseData = { body: response.body, status: response.status };
    }

    console.log(`   └─ Status: ${response.status} (${duration}ms)`);
    console.log("   └─ Response:", JSON.stringify(responseData).slice(0, 200));

    if (responseData.data?.audioUrl) {
      console.log("   └─ Got audioUrl:", responseData.data.audioUrl);
    }

    return NextResponse.json({
      ...responseData,
      success: response.status >= 200 && response.status < 300,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `   ✗ Podcast generate error (${duration}ms):`,
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
