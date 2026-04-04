import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiGenerate(
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 300,
        temperature: options?.temperature ?? 0.3,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`[Gemini] Response received (${text.length} chars)`);
    return text;
  } catch (err) {
    console.error('[Gemini] Error:', err);
    throw err;
  }
}
