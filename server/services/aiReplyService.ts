import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ReviewData {
  reviewText: string;
  authorName: string;
  stars: number;
}

export interface AIReplySettings {
  enabled: boolean;
  minStars: number;
  instructions: string;
}

export async function generateAIReply(
  review: ReviewData,
  settings: AIReplySettings
): Promise<string> {
  const systemPrompt = `Jesteś asystentem odpowiadającym na opinie Google w imieniu firmy. 
Twoje odpowiedzi powinny być:
- Krótkie (2-4 zdania)
- Uprzejme i profesjonalne
- W języku polskim
- Spersonalizowane (użyj imienia klienta)
${settings.instructions ? `\nDodatkowe instrukcje: ${settings.instructions}` : ''}`;

  const userPrompt = `Napisz odpowiedź na następującą opinię:

Autor: ${review.authorName}
Ocena: ${review.stars}/5 gwiazdek
Treść opinii: ${review.reviewText || '(brak treści, tylko ocena)'}

Odpowiedz krótko i uprzejmie, dziękując za opinię.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('AI reply generation error:', error);
    throw new Error('Failed to generate AI reply');
  }
}
