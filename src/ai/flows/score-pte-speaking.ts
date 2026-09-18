'use server';

import { z } from 'genkit';
import { callWithFallback } from '@/ai/genkit';

/**
 * AI scoring for PTE Academic SPEAKING tasks. The student's recorded audio is
 * sent to Gemini (multimodal) which transcribes it and scores the three
 * Pearson "enabling skills" — Content, Oral Fluency, Pronunciation — each on
 * the 0–90 scale, plus an overall 10–90. Works for all mic-based tasks; the
 * rubric text is tailored per task type.
 */

const SpeakingScoreSchema = z.object({
  transcript: z.string().describe("A faithful transcript of exactly what the student said."),
  content: z.number().min(0).max(90).describe("Content score 0-90: relevance & completeness vs the prompt."),
  fluency: z.number().min(0).max(90).describe("Oral fluency 0-90: rhythm, phrasing, natural pace, few hesitations/repetitions."),
  pronunciation: z.number().min(0).max(90).describe("Pronunciation 0-90: clarity, vowels/consonants, stress & intonation (best-effort from audio)."),
  overall: z.number().min(10).max(90).describe("Overall speaking score 10-90."),
  contentFeedback: z.string().describe("1-2 sentences on content."),
  fluencyFeedback: z.string().describe("1-2 sentences on fluency."),
  pronunciationFeedback: z.string().describe("1-2 sentences on pronunciation."),
  tips: z.array(z.string()).max(3).describe("Up to 3 concrete improvement tips."),
});
export type SpeakingScore = z.infer<typeof SpeakingScoreSchema>;

export interface SpeakingScoreInput {
  taskType: string;
  /** The reference text (Read Aloud/Repeat Sentence), the question, image caption, or lecture gist. */
  promptText: string;
  /** data:audio/...;base64,... of the student's recording. */
  audioDataUri: string;
}

const RUBRICS: Record<string, string> = {
  'read-aloud':
`READ ALOUD: the student reads the displayed paragraph aloud (the prompt text is that exact paragraph). Score CONTENT, ORAL FLUENCY and PRONUNCIATION independently (each on the 0–90 scale).

This task does NOT test comprehension, summary, paraphrase, vocabulary or ideas — the student simply reads the given text. Here CONTENT means READING ACCURACY only.

First align the student's speech to the paragraph and note (for feedback): words correctly read, skipped/omitted words, substitutions (e.g. "degradation"→"damage"), added words, repetitions, restarts, self-corrections, and roughly what % of the passage was read.

CONTENT = reading accuracy (0–90): how completely and accurately the DISPLAYED words were read in order. Omissions, substitutions and additions lower it; reading the whole passage accurately is ~90. Do NOT judge meaning/comprehension. If the spoken response is substantially UNRELATED to the paragraph (memorised/other text), treat it as an INVALID read-aloud and score content very low regardless of fluency.

ORAL FLUENCY (0–90) — smoothness, rhythm, phrasing into meaningful word-groups, appropriate pace, continuity; penalise real hesitation, unnatural pauses, repetition, restarts, false starts, fragmentation.
- Do NOT mechanically reduce Fluency just because a word was SKIPPED. Ask: did the omission actually break the rhythm/continuity? If the student smoothly reads on past a skipped hard word, do not deduct for the omission itself (but flag the word). If skipping caused stalling/restarts ("The... archae... archaeological... the investigation…"), THEN reduce for the observed disruption.
- Word-by-word reading ("The… development… of… technology…") gets LOW fluency even if each word is clear.
- Do NOT scale Fluency to the % read — a partial but substantial reading delivered smoothly can still score high.

PRONUNCIATION (0–90) — clarity/intelligibility of the words ACTUALLY attempted (sounds, word/sentence stress, connected speech). Do NOT penalise a non-native accent when words stay intelligible. A SKIPPED word is NOT a mispronounced word — never invent a pronunciation error for a word the student did not say. Very fast speech that swallows sounds lowers Pronunciation.

SAFEGUARD: do NOT award near-maximum on only one or two easy words — there must be enough continuous speech to assess reliably; if the student read only a tiny fragment, keep scores cautious and note "insufficient speech for reliable assessment". Fluency and Pronunciation are separate: clear pronunciation does not guarantee good fluency, and vice-versa.`,
  'repeat-sentence':
`REPEAT SENTENCE: the student repeats aloud the sentence they heard (the prompt text is that exact reference sentence). Score CONTENT, ORAL FLUENCY and PRONUNCIATION independently (each on the 0–90 scale). NEVER derive Fluency or Pronunciation from the Content percentage.

CONTENT — how accurately the student reproduced the reference sentence's words in the correct sequence. Compare directly and count:
- OMISSION: a reference word is missing (do not count as reproduced).
- REPLACEMENT: a reference word swapped for another — even a synonym is NOT the same word, so it does not count as correct.
- INSERTION: a word/phrase not in the reference (e.g. adding "significantly", or inventing "and I think this is important for society"). Do not count inserted words as content, and never reward invented filler used just to keep talking.
Map to 0–90 by the share of reference words correctly reproduced in sequence: ~79–90 = all/almost all words in correct order; ~55–78 = at least ~50% correct in largely correct order; ~25–54 = under 50% but recognisable words/phrases; <25 = almost nothing correct / unrelated.
Do NOT reduce Content for pauses or hesitation — if the words are correct, they count even if the student paused. Pauses belong to Fluency.

ORAL FLUENCY — judge the ACTUAL delivery: continuity, rhythm, phrasing, speed, hesitation, pauses, repetition, false starts, restarts, self-correction, fragmentation, abandoned phrases. Do NOT mechanically lower Fluency because Content was incomplete — but if forgetting part of the sentence caused real problems (long pauses, broken rhythm, restarts, fragmentation, filler), lower Fluency for those OBSERVED behaviours. A smoothly delivered partial sentence can still score well; a short fragment blurted quickly is NOT automatically 5.

PRONUNCIATION — clarity and intelligibility of the words ACTUALLY produced (sounds, word/sentence stress, connected speech). Do NOT penalise a non-native accent, and do NOT lower Pronunciation just because recall was incomplete — a student who says only 60% of the sentence but says it clearly can still score well on Pronunciation. Never use invented/unrelated wording to inflate the score.`,
  'describe-image':
`DESCRIBE IMAGE: the student describes an image (the prompt text is what the image shows / its data). Score CONTENT, ORAL FLUENCY and PRONUNCIATION independently (each on the 0–90 scale).

CONTENT — do NOT simply count how many numbers/labels/objects the student names. Judge whether the response builds a meaningful, accurate description:
1. Identify the IMAGE TYPE (bar/line/pie chart, table, map, process/cycle/flowchart, scientific diagram, photo/illustration, infographic…) and adapt what counts as important:
   • Charts/graphs/tables → main topic + highest/lowest values, major trend/increase/decrease, key differences/similarities, overall pattern. Reward COMPARISON over reading numbers: "China records the highest figure, followed by India, while Australia is lowest" beats "China 50, India 40, Australia 20".
   • Maps → geographical distribution / regional patterns / concentrations, not a list of place names.
   • Process/cycle/flowchart → what process, start point, major stages, sequence, final result, linear vs cyclical (every tiny stage not required).
   • Photo/illustration → main subject, setting, key people/objects, visible actions, overall scene (no unsupported speculation).
   • Diagram → subject, main components and how they relate, direction/flow, overall structure.
2. Identify the MAIN TOPIC and the MOST IMPORTANT features (main features > relationships/comparisons > supporting details > minor details).
3. RELATIONSHIPS are key to high scores: higher/lower, increase/decrease, largest/smallest, similar/different, before/after, part/whole, distribution, stage/sequence, contrast. Isolated facts earn some credit; connecting them earns more.
4. MENTAL-PICTURE TEST: "if a listener could NOT see the image and heard only this, could they form a reasonably accurate picture of what it shows and how the important features relate?" Use this as the main guide.
- Accept approximate numbers (approximately/around/just over) when the relationship stays accurate — do not require every number; but significant numerical errors that change the interpretation DO reduce Content. Do not reward incorrect interpretation (e.g. saying "decrease" when it rose) or invented information, even if the delivery sounds fluent.
- Map to 0–90: ~79–90 = topic + main features + relationships described accurately and coherently, full mental picture; ~65–78 = main features + some relationships, minor gaps/inaccuracies; ~50–64 = basic accurate description, relationships weak, basic mental picture; ~35–49 = superficial, important features/relationships missing; ~15–34 = mainly a list of disconnected labels/numbers; <15 = little meaningful description.

ORAL FLUENCY — judge actual delivery only (continuity, rhythm, phrasing, pace, hesitations, pauses, repetitions, restarts, fragmentation). Do not tie it to content quality.

PRONUNCIATION — clarity/intelligibility of the words produced (sounds, word/sentence stress, connected speech). Do not penalise a non-native accent when speech stays intelligible; identify specific unclear words where possible.`,
  'retell-lecture':
`RETELL LECTURE: the student re-tells a lecture (the prompt text is the lecture gist/transcript). Score CONTENT, ORAL FLUENCY and PRONUNCIATION independently (each still on the 0–90 scale).

CONTENT — first internally analyse the lecture: main topic, major/main ideas (factors, causes, effects, stages, findings, problems, solutions), important supporting information, the conclusion/overall message, and the meaningful key phrases/concepts. Then judge the student's retell against it:
- Key phrases are EVIDENCE OF COMPREHENSION, not a mechanical count. There is NO fixed number of phrases required for a top score, and simply listing keywords is not enough.
- Accept accurate PARAPHRASING — the student need not use the lecture's exact wording. "Loss of natural habitats is driving biodiversity decline" fully captures "habitat destruction is a major cause of declining biodiversity".
- MAIN-FACTOR RULE: if a lecture centres on a few major factors and the student identifies them all, that is strong evidence of comprehension — but merely NAMING them ("the lecture is about X and Y") is NOT automatically full marks; the student must also communicate enough relevant information to make the retelling meaningful.
- MEANINGFUL-SUMMARY TEST: ask "if a listener had not heard the lecture, would this response give them a meaningful, reasonably accurate understanding of it?" If yes → strong content. If it is only isolated keywords without relationships/meaning → reduce content.
- A shorter answer with the correct topic + major ideas + meaningful support can score HIGHER than a long answer full of random details. Do not demand every detail; do not penalise omission of minor details; do not reward invented/inaccurate information.
- Map to 0–90: ~79–90 = full comprehension, main ideas + support, coherent, no major distortion; ~65–78 = main ideas clear, minor gaps; ~50–64 = some main ideas + support, weak connections or over-reliance on lecture wording, still understandable; ~35–49 = partial, important points missing; ~15–34 = mostly isolated words, little understanding; <15 = unrelated/too limited.

ORAL FLUENCY — smoothness, rhythm, phrasing, appropriate pace, and absence of unnatural hesitations, long pauses, repetitions, false starts, self-corrections and fragmentation. Judge the DELIVERY only, never the content.

PRONUNCIATION — individual sounds, word pronunciation, stress, intonation, connected speech, overall intelligibility. Do NOT penalise a non-native accent — the question is whether the listener can clearly understand the words and meaning. Identify specific mispronounced words in the feedback where possible.`,
  'answer-short-question':
    'ANSWER SHORT QUESTION: the student answers a simple question in one or a few words (prompt text = the question; the ideal answer is a common word). Content = is the answer correct? (this dominates). Fluency & pronunciation = minor.',
  'respond-to-situation':
`RESPOND TO A SITUATION: the student speaks a real-life response to a described situation (the prompt text is the situation). Score CONTENT, ORAL FLUENCY and PRONUNCIATION independently (each on the 0–90 scale).

CONTENT — first internally analyse the situation: what happened, the student's ROLE, who they are speaking TO, the PRIMARY COMMUNICATION GOAL (request / apologise / complain / refuse / suggest / negotiate / ask permission / reschedule / persuade / explain, etc.), the required context, any constraints, and the appropriate TONE. Then judge whether the student ACHIEVED that goal:
- THE CENTRAL RULE: distinguish DESCRIBING the situation from RESPONDING to it. "I have an appointment at the same time as the meeting" only describes the problem; "Could we move our meeting to the afternoon? I'm sorry for the inconvenience" actually responds. NEVER give high Content just because the student repeated/described the situation.
- Do NOT reward copied prompt wording, memorised template language, irrelevant filler, or invented information that changes the situation. The student must USE the information to communicate (explain / request / apologise / offer a solution / persuade, as required).
- Include enough context to make the response make sense, but do not mechanically count prompt details. Judge TONE by the real relationship (formal to a professor/manager; informal with a friend is fine) — rude/inappropriate tone weakens content; do not demand excessive formality everywhere.
- DEVELOPMENT: a concise response that fully accomplishes the goal can score high; a long response full of repetition/irrelevance should not.
- Map to 0–90: ~79–90 = goal fully accomplished, context handled, situationally appropriate, well developed, natural; ~65–78 = goal accomplished with minor omission/imprecision; ~50–64 = goal partially accomplished, some context missing; ~35–49 = only the basic intention achieved / leans on prompt wording; ~15–34 = goal not achieved, mostly describes or repeats the prompt; <15 = no meaningful response to the situation. The final check is always: "did the student actually communicate what this specific situation required?"

ORAL FLUENCY — judge actual delivery only (continuity, rhythm, phrasing, pace, hesitations, pauses, repetitions, restarts, fragmentation). Do not derive it from content; an incomplete answer can still be delivered fluently.

PRONUNCIATION — clarity/intelligibility of the words produced (sounds, word/sentence stress, connected speech). Do not penalise a non-native accent when speech stays intelligible; identify specific unclear words where possible.`,
  'summarize-group-discussion':
`SUMMARIZE GROUP DISCUSSION: the student summarises a discussion between several speakers (the prompt text is the discussion gist/transcript). Score CONTENT, ORAL FLUENCY and PRONUNCIATION independently (each on the 0–90 scale).

CONTENT — first internally analyse the discussion: the main topic, EACH speaker's important contribution/viewpoint, the major ideas, important supporting information, and the RELATIONSHIPS between viewpoints (agree, disagree, partially agree, contrast, add a perspective, develop another's point, shared conclusion). Then judge the student's summary against it:
- This is a GROUP DISCUSSION, not a lecture — a strong response shows awareness that different people contributed different ideas (e.g. "one speaker argued…, while another countered…"). Exact speaker names are not required.
- The single most important quality is SYNTHESIS of relationships, not a list. "Online learning is flexible and students can feel isolated" (a flat list) scores lower than "one speaker praised the flexibility of online learning, while another accepted that benefit but warned about social isolation" (shows the relationship).
- Key phrases are EVIDENCE of comprehension, not a mechanical count — no fixed number earns full marks. Accept accurate paraphrase/synonyms; do not count random/repeated keywords, memorised template language, or invented information.
- Do not require equal coverage of every speaker (some contribute more), but a summary of only ONE speaker that ignores other major contributions should NOT get full marks.
- MEANINGFUL-SUMMARY TEST: "would a listener who missed the discussion understand what was discussed and how the important viewpoints related?" If yes → strong content; if only isolated phrases → reduce.
- Map to 0–90: ~79–90 = topic + main ideas + speakers' key contributions + relationships synthesised coherently; ~65–78 = main ideas and some relationships captured, minor gaps; ~50–64 = some ideas/speakers but weak on relationships (more list than synthesis); ~35–49 = partial, important perspectives missing; ~15–34 = mostly isolated keywords; <15 = little meaningful representation.

ORAL FLUENCY — judge actual delivery only (continuity, rhythm, phrasing, pace, hesitations, pauses, repetitions, restarts, fragmentation). Do not lower it just because content is weak, nor raise it just because content is strong.

PRONUNCIATION — clarity/intelligibility of the words produced (sounds, word/sentence stress, connected speech). Do not penalise a non-native accent when speech stays intelligible; identify specific unclear words where possible.`,
};

export async function scorePteSpeaking(input: SpeakingScoreInput): Promise<SpeakingScore> {
  const rubric = RUBRICS[input.taskType] ?? 'General PTE Academic speaking rubric: score content, fluency and pronunciation.';

  return callWithFallback(async (ai) => {
    const { output } = await ai.generate({
      prompt: [
        {
          text:
`You are a strict but fair PTE Academic speaking examiner. Score the attached audio recording using the official Pearson enabling skills.

TASK TYPE: ${input.taskType}
${rubric}

PROMPT / REFERENCE:
"""
${input.promptText}
"""

Steps:
1. Transcribe the audio exactly (including filler words and mistakes).
2. Score Content, Oral Fluency and Pronunciation each on the 0–90 Pearson scale.
3. Give an overall score 10–90 (roughly the weighted blend for this task type).
4. Write concise, specific feedback for each skill and up to 3 actionable tips. Refer to the student's ACTUAL delivery, not generic advice.

Score the three skills INDEPENDENTLY — do not let one drag another:
- A fluent, well-pronounced answer that misses the required content still gets high Fluency/Pronunciation but LOW Content.
- An answer with strong content but unclear pronunciation gets high Content and LOWER Pronunciation.
- Never reduce Content because pronunciation is weak, and never reduce Fluency because content is weak.
Be realistic: silence or off-topic answers score very low on the relevant skill; near-perfect delivery scores 80+.`,
        },
        { media: { url: input.audioDataUri } },
      ],
      output: { schema: SpeakingScoreSchema },
      config: { temperature: 0.2 },
    });
    if (!output) throw new Error('AI failed to score the recording.');
    return output;
  }, { task: 'server-action' });
}
