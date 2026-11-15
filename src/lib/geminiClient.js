// Client-side direct Gemini API fallback (used when deployed on static hosting without a Node backend)
import { normalizeRoadmap } from '../../shared/normalize.js';

export const getClientApiKey = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY?.trim()) ||
  localStorage.getItem('user_gemini_key') ||
  '';

const MODEL = 'gemini-2.5-flash';

const schema = {
  type: 'OBJECT',
  properties: {
    goalJa: { type: 'STRING' },
    summary: { type: 'STRING' },
    summaryJa: { type: 'STRING' },
    mountainScale: {
      type: 'INTEGER',
      description: 'Mountain scale rating from 1 to 10 evaluating the overall depth, ambition, and difficulty of this learning goal (1 = tiny hill, 5 = standard mountain, 7 = high alpine peak, 10 = colossal Everest-scale summit).',
    },
    mountainScaleReason: {
      type: 'STRING',
      description: 'One short sentence explaining why this goal was rated this scale out of 10 in English.',
    },
    mountainScaleReasonJa: {
      type: 'STRING',
      description: 'One short sentence explaining why this goal was rated this scale out of 10 in natural Japanese.',
    },
    nodes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          title: { type: 'STRING' },
          titleJa: { type: 'STRING' },
          description: { type: 'STRING' },
          descriptionJa: { type: 'STRING' },
          hours: { type: 'NUMBER' },
          week: { type: 'INTEGER' },
          difficulty: { type: 'INTEGER' },
          restAfter: { type: 'BOOLEAN' },
          restReason: { type: 'STRING' },
          restReasonJa: { type: 'STRING' },
          prerequisites: { type: 'ARRAY', items: { type: 'STRING' } },
          resources: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: [
          'id',
          'title',
          'titleJa',
          'description',
          'descriptionJa',
          'hours',
          'week',
          'difficulty',
          'restAfter',
          'restReason',
          'restReasonJa',
          'prerequisites',
          'resources',
        ],
      },
    },
  },
  required: ['goalJa', 'summary', 'summaryJa', 'mountainScale', 'mountainScaleReason', 'mountainScaleReasonJa', 'nodes'],
};

export async function generateRoadmapClient(input) {
  const apiKey = getClientApiKey();
  if (!apiKey) throw new Error('No API key available');

  const totalHours = Math.round(input.months * 30 * input.hoursPerDay);
  const weeks = Math.max(1, Math.round(input.months * 4.3));
  const prompt = `You are an expert learning designer. Create a personalized learning roadmap as a knowledge graph (a "Knowledge Mountain") with BOTH English and natural Japanese fields.
Student profile:
- Goal: ${input.goal}
- Timeframe: ${input.months} month(s) (~${weeks} weeks)
- Level: ${input.level}
- Study time: ${input.hoursPerDay} hours per day (~${totalHours} hours total)
${input.mountainScale ? `- Preferred Mountain Scale: ${input.mountainScale}/10` : ''}

MOUNTAIN SCALE EVALUATION (Scale 1 to 10):
Rate the ambition, scope, and technical depth of this learning goal on an integer scale from 1 to 10 (mountainScale). This rating physically resizes the 3D Mountain rendered in the app:
- 1 to 2 (Tiny Hill / Foothill ~850m - 1,700m): A brief hobby, weekend tutorial, single syntax introduction, or quick mini-project (<25 hours). The mountain will render as a small, gentle rolling hill.
- 3 to 4 (Small Mountain ~2,500m - 3,500m): A focused intermediate skill or basic framework course (25-60 hours).
- 5 to 6 (Standard Alpine Peak ~4,400m - 5,300m): Solid university-level course, full framework mastery (60-150 hours).
- 7 to 8 (High Alpine Summit ~6,200m - 7,100m): QUITE BIGGER. Demanding professional domain, comprehensive full-stack/AI skill, multi-month disciplined study (150-350 hours).
- 9 to 10 (Colossal Everest Summit ~8,000m - 8,848m): Massive epic undertaking, zero-to-expert career transformation, deep specialized mastery (350+ hours).
${input.mountainScale ? `(Note: The student preferred mountainScale = ${input.mountainScale}; please use this scale or refine it slightly based on their actual goal.)` : ''}
Provide:
- mountainScale: integer 1..10
- mountainScaleReason: 1 sentence explaining why this rating was assigned in English
- mountainScaleReasonJa: 1 sentence explaining why this rating was assigned in natural Japanese

Rules:
- 10 to 16 topics.
- Every prerequisite appears EARLIER than the topic that needs it.
- Difficulty 1..5. Set restAfter=true on 3 hardest topics (test difficulty 4 or 5) for recovery camps.
- Provide title, description, restReason in English AND titleJa, descriptionJa, restReasonJa in Japanese.
- The last topic is a capstone project.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.7 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  const parsed = JSON.parse(text);
  return normalizeRoadmap({ ...parsed, source: 'ai' }, input);
}

const quizSchema = {
  type: 'OBJECT',
  properties: {
    testDifficulty: { type: 'INTEGER' },
    restIfPassed: { type: 'BOOLEAN' },
    restAdvicePassed: { type: 'STRING' },
    restAdviceStruggled: { type: 'STRING' },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          q: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          answer: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
        },
        required: ['q', 'options', 'answer', 'explanation'],
      },
    },
  },
  required: ['testDifficulty', 'restIfPassed', 'restAdvicePassed', 'restAdviceStruggled', 'questions'],
};

export async function generateQuizClient({ title, description, goal, difficulty = 3, hoursSinceRest = 0, lang = 'en' }) {
  const apiKey = getClientApiKey();
  if (!apiKey) throw new Error('No API key available');

  const langRule =
    lang === 'ja'
      ? 'Write all questions, options, explanations, restAdvicePassed, and restAdviceStruggled in natural Japanese.'
      : 'Write all questions, options, explanations, restAdvicePassed, and restAdviceStruggled in English.';

  const prompt = `Create a 2-question multiple-choice checkpoint test for a student climbing a "Knowledge Mountain" toward "${goal}".
Topic: "${title}"
Description: "${description}"
Expected difficulty: ${difficulty}/5 (1=easy, 5=very hard)
Hours studied since last rest stop: ${hoursSinceRest}h

Rules:
- ${langRule}
- Match the question rigor to difficulty ${difficulty}/5.
- Each question must have 4 concise options and answer (0..3).
- Set testDifficulty (1..5) to how hard this test actually is.
- Decide whether the student should rest after this test:
  - Set restIfPassed=true if testDifficulty >= 4 OR hoursSinceRest >= 35. Otherwise false.
  - Write restAdvicePassed (1 sentence from the AI Sherpa).
  - Write restAdviceStruggled (1 sentence from the AI Sherpa).`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: quizSchema, temperature: 0.7 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return JSON.parse(text);
}
