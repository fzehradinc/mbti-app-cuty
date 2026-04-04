// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const WIRO_BASE_URL = Deno.env.get("WIRO_BASE_URL") ?? "https://api.wiro.ai/v1";
const WIRO_API_KEY = Deno.env.get("WIRO_API_KEY") ?? "";
const WIRO_MODEL = Deno.env.get("WIRO_MODEL") ?? "elevenlabs/speech-to-text";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = Number(Deno.env.get("WIRO_TIMEOUT_MS") ?? "60000");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function errorJson(message: string, status = 500) {
  console.error("[transcribe]", message);
  return json({ error: message }, status);
}

/** Poll Wiro Task/Detail until terminal status or timeout */
async function pollTask(taskId: string): Promise<Record<string, unknown>> {
  const deadline = Date.now() + MAX_POLL_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${WIRO_BASE_URL}/Task/Detail`, {
      method: "POST",
      headers: {
        "x-api-key": WIRO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskid: taskId }),
    });

    if (!res.ok) {
      throw new Error(`Task/Detail HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const task = data.tasklist?.[0];
    if (!task) throw new Error("No task in response");

    const status = task.status as string;
    console.log("[transcribe] poll", taskId, "→", status);

    if (status === "task_postprocess_end") return task;
    if (status === "task_cancel") throw new Error("Task was cancelled");

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error("Transcription timed out");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return errorJson("Method not allowed", 405);
  }

  if (!WIRO_API_KEY) {
    return errorJson("WIRO_API_KEY not configured", 500);
  }

  try {
    // ── Extract audio from incoming request ──
    const contentType = req.headers.get("content-type") ?? "";
    let audioBlob: Blob | null = null;
    let audioFilename = "recording.m4a";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio");
      if (file instanceof File) {
        audioBlob = file;
        audioFilename = file.name || audioFilename;
      }
    } else {
      // Accept raw binary body
      const buf = await req.arrayBuffer();
      if (buf.byteLength === 0) {
        return errorJson("No audio data received", 400);
      }
      audioBlob = new Blob([buf], { type: "audio/m4a" });
    }

    if (!audioBlob || audioBlob.size === 0) {
      return errorJson("Empty audio data", 400);
    }

    console.log("[transcribe] Audio received:", audioBlob.size, "bytes,", audioFilename);

    // ── Call Wiro Run endpoint ──
    const runForm = new FormData();
    runForm.append("inputAudio", audioBlob, audioFilename);

    const runRes = await fetch(`${WIRO_BASE_URL}/Run/${WIRO_MODEL}`, {
      method: "POST",
      headers: { "x-api-key": WIRO_API_KEY },
      body: runForm,
    });

    if (!runRes.ok) {
      const errText = await runRes.text();
      return errorJson(`Wiro Run failed (${runRes.status}): ${errText}`, 502);
    }

    const runData = await runRes.json();
    if (!runData.result || !runData.taskid) {
      return errorJson(`Wiro Run error: ${JSON.stringify(runData.errors)}`, 502);
    }

    const taskId = runData.taskid as string;
    console.log("[transcribe] Task created:", taskId);

    // ── Poll until completion ──
    const task = await pollTask(taskId);

    // ── Extract transcript from output ──
    // ElevenLabs STT returns the transcript in outputs or debugoutput
    let transcript = "";

    // Check outputs array for downloadable result
    const outputs = (task.outputs as Array<{ url: string; name: string; contenttype: string }>) ?? [];
    if (outputs.length > 0) {
      // Download the first output file
      const outFile = outputs[0];
      console.log("[transcribe] Downloading output:", outFile.name, outFile.contenttype);
      const outRes = await fetch(outFile.url);
      if (outRes.ok) {
        const outText = await outRes.text();
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(outText);
          transcript = parsed.text ?? parsed.transcript ?? parsed.transcription ?? outText;
        } catch {
          transcript = outText;
        }
      }
    }

    // Fallback: check debugoutput
    if (!transcript && task.debugoutput) {
      const debug = String(task.debugoutput);
      try {
        const parsed = JSON.parse(debug);
        transcript = parsed.text ?? parsed.transcript ?? debug;
      } catch {
        transcript = debug;
      }
    }

    // Fallback: check parameters for output
    if (!transcript && task.parameters) {
      const params = task.parameters as Record<string, unknown>;
      transcript = String(params.text ?? params.transcript ?? params.output ?? "");
    }

    if (!transcript) {
      return errorJson("Transcription completed but no text found in output", 502);
    }

    console.log("[transcribe] Success, length:", transcript.length);
    return json({ text: transcript.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorJson(msg, 500);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/transcribe' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
