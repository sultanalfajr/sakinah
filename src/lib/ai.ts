/**
 * مهايئ ذكاء اصطناعي مزدوج:
 * - إذا ضُبط AI_API_KEY + AI_BASE_URL: نداء fetch متوافق مع OpenAI
 *   (يعمل على Cloudflare Workers وبأي مزوّد: z.ai / OpenAI / Groq / OpenRouter...)
 * - وإلا: z-ai-web-dev-sdk المحلي (بيئة التطوير)
 *
 * المتغيرات البيئية:
 *   AI_BASE_URL    مثل https://api.z.ai/api/paas/v4 أو https://api.openai.com/v1
 *   AI_API_KEY     مفتاح المزوّد
 *   AI_CHAT_MODEL  افتراضي: gpt-4o-mini
 *   AI_TTS_MODEL   افتراضي: tts-1
 *   AI_TTS_VOICE   افتراضي: alloy
 *   AI_TTS_PATH    افتراضي: /audio/speech  (زد.اي تستخدم /audio/tts)
 */

type ChatMessage = { role: string; content: string };

export function aiEnvConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY && process.env.AI_BASE_URL);
}

async function fetchChat(messages: ChatMessage[]): Promise<string> {
  const base = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_CHAT_MODEL ?? "gpt-4o-mini",
      messages,
      temperature: 0.9,
    }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`AI chat failed (${res.status}): ${detail}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function fetchTts(input: string): Promise<ArrayBuffer> {
  const base = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
  const ttsPath = process.env.AI_TTS_PATH ?? "/audio/speech";
  const res = await fetch(`${base}${ttsPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_TTS_MODEL ?? "tts-1",
      input,
      voice: process.env.AI_TTS_VOICE ?? "alloy",
      speed: 0.8,
      response_format: "wav",
    }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`AI tts failed (${res.status}): ${detail}`);
  }
  return res.arrayBuffer();
}

async function sdkChat(messages: ChatMessage[]): Promise<string> {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const zai = await ZAI.create();
  const completion = (await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  })) as { choices?: Array<{ message?: { content?: string } }> } | null;
  return completion?.choices?.[0]?.message?.content ?? "";
}

async function sdkTts(input: string): Promise<ArrayBuffer> {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const zai = await ZAI.create();
  const response = (await zai.audio.tts.create({
    input,
    voice: "tongtong",
    speed: 0.8,
    response_format: "wav",
    stream: false,
  })) as { arrayBuffer: () => Promise<ArrayBuffer> };
  return response.arrayBuffer();
}

/** إكمال محادثة — يختار المسار المناسب تلقائياً */
export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  if (aiEnvConfigured()) return fetchChat(messages);
  return sdkChat(messages);
}

/** توليد صوت لنص معيّن — يختار المسار المناسب تلقائياً */
export async function ttsAudio(input: string): Promise<ArrayBuffer> {
  if (aiEnvConfigured()) return fetchTts(input);
  return sdkTts(input);
}

/** رسالة خطأ عربية عند عدم ضبط مفتاح AI في النشر */
export const AI_NOT_CONFIGURED_MESSAGE =
  "ميزة الذكاء الاصطناعي تحتاج مفتاح API. أضف AI_BASE_URL و AI_API_KEY في إعدادات المنصة";
