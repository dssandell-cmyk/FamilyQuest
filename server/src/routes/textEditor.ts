import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

router.post('/suggest', async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    res.status(400).json({ error: 'Please provide at least 10 characters of text to analyze.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Anthropic API key is not configured on the server.' });
    return;
  }

  const client = new Anthropic({ apiKey });

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: `You are an expert writing coach and copy editor. Analyze text and return structured improvement suggestions as JSON.

Your response must be ONLY valid JSON — no markdown, no code blocks, no extra text — with this exact structure:
{
  "overall_score": <integer 0-100>,
  "summary": "<1-2 sentence assessment of the text quality and tone>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "suggestions": [
    {
      "id": "<unique_short_id e.g. g1, s1, p1, st1>",
      "type": "grammar" | "spelling" | "punctuation" | "style",
      "priority": "high" | "medium" | "low",
      "original": "<verbatim text from input that should change — must be an exact substring>",
      "suggestion": "<the corrected or improved replacement text>",
      "explanation": "<concise, actionable reason — under 15 words>"
    }
  ]
}

Scoring guide: 90-100 = near-perfect, 70-89 = good with minor issues, 50-69 = several improvements needed, below 50 = significant revision required.

Coverage requirements:
- Grammar: subject-verb agreement, tense consistency, pronoun case, dangling modifiers
- Spelling: misspelled words, homophones used incorrectly
- Punctuation: missing/extra commas, incorrect apostrophes, run-on sentences, missing periods
- Style: passive voice, wordiness, vague language, repetition, unclear antecedents, sentence variety

Rules:
- "original" must be an EXACT substring of the input text
- List suggestions by priority (high first)
- 2-3 strengths that genuinely apply to the text
- If text is excellent, return an empty suggestions array and a high score
- Respond ONLY with the JSON object`,
      messages: [
        {
          role: 'user',
          content: `Analyze this text:\n\n${text}`,
        },
      ],
    });

    const message = await stream.finalMessage();
    const content = message.content[0];

    if (content.type !== 'text') {
      res.status(500).json({ error: 'Unexpected response format from AI.' });
      return;
    }

    // Strip any accidental markdown code fences
    let jsonText = content.text.trim();
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    const result = JSON.parse(jsonText);
    res.json(result);
  } catch (err) {
    console.error('Text editor route error:', err);
    if (err instanceof SyntaxError) {
      res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    } else {
      res.status(500).json({ error: 'Failed to analyze text. Please try again.' });
    }
  }
});

export default router;
