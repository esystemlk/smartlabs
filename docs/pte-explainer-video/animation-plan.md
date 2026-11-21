# "What is the PTE exam": advanced animation plan

**Status:** plan only, no video files changed. Written 4 Nov 2026.
**Video:** 2560×1440, 16:9, 30 fps, 5:05 (9,148 frames).
**Project folder:** `C:\Users\SMART LABS\Downloads\video\video`
**Current video:** `out/ptevo/smartlabs-what-is-pte-2k-16x9.mp4`
**New video:** `out/ptevo/smartlabs-what-is-pte-v2-2k-16x9.mp4`. The current file is not overwritten.

## 1. Goal and approach

Rebuild the visuals to look like a professional motion graphics explainer, while keeping the voice and its timing.

**The problem now:** `src/ptevo.js` uses nearly one recipe throughout. A white card pops in with `pop()`, stays still, and fades out with `stage2()`. A colour wipe then separates the sections, on the same dotted background. The exam tasks sit in small panels.

**The approach:**
- **One continuous camera** moves through a single 3D world.
- **Full-size exam demonstrations** replace the small panels.
- **Real 3D** is used for a few hero objects.
- **Motion carries the meaning.** Each move explains something, rather than decorating the screen.

**What stays fixed:** `voice.wav` and `timeline.js`, which hold the 59 clips and their times. Any new render is checked against their file hashes, so the sync we already verified cannot drift.

## 2. What the research changes

| Finding | Evidence | Rule for this video |
|---|---|---|
| Removing extra material improves learning | Coherence principle: 23 of 23 tests, median effect 0.86 | **The biggest risk of "more advanced" is distraction.** Only one main motion at a time, and background motion stays faint |
| Showing animation and narration together beats showing them one after the other | Temporal contiguity: 9 of 9 tests, median 1.22 | Each visual lands on the word that names it |
| Labels near the object beat labels far away | Spatial contiguity: 22 of 22 tests, median 1.10 | Labels attach to objects, and do not sit in a separate list |
| Cues showing the structure help | Signaling: 24 of 28 tests, median 0.41 | Use a highlight or camera push on the one thing being discussed, plus a progress rail |
| Breaking content into segments helps | Segmenting: d = 0.70 in Mayer's 2017 review | Clear part changes, plus YouTube chapter times |
| Narration plus duplicated on-screen text can hurt | Redundancy: 16 of 16 tests, median 0.86 | Cards show keywords only, never the full sentence |
| Same-language captions help second-language listeners | Montero Perez et al. 2013: large effect across 15 listening studies. I did not read the full paper | **Keep the captions.** Your students are English learners, so this outweighs the redundancy finding, but they are the only full-sentence text on screen |
| Shorter videos hold attention better | Guo, Kim and Rubin 2014: 6.9 million video sessions | Stay at 5:05 and add no extra scenes |
| Follow-through and overlap make motion read as natural | Common animation principles from design guides, not controlled studies | Objects overshoot slightly and settle, and parts of a group arrive at different times |

**Gaps in the research:**
- I found no solid study on how fast visuals should change.
- I found no technical breakdown of how top explainer channels build their transitions.

The camera and morph choices are therefore my design judgement, which the 20-second test will check.

## 3. Tests on your PC

**PC:** Intel Core i7-6700 (4 cores, 8 threads), Intel HD Graphics 530, 16 GB RAM, 44 GB free on C:.

I rendered a test scene through the current pipeline: a globe of 12,000 dots, three shiny blocks with shadows, and text, at 2K.

| Graphics mode | Workers | Speed (frames per second) |
|---|---|---|
| Intel GPU (the default) | 1 | 5.3 |
| Intel GPU | 2 | 9.6 |
| **Intel GPU** | **4** | **13.8 (best)** |
| Intel GPU | 8 | 13.8, no gain |
| Software only (SwiftShader) | 1 | 0.9 |
| Software only (SwiftShader) | 8 | 0.8 |

**What this means:**
- **3D is practical.** The GPU is about 15 times faster than software rendering at the best settings.
- **Use 4 workers for 3D shots.** 8 adds nothing.
- **Frames are repeatable.** The same time gave a byte-identical picture on every run, so parallel workers should not cause flicker.
- **Shadows need work.** The test shadows have hard edges and look cheap. Use a soft baked contact shadow instead.
- **The current video took about 16 minutes** to render and encode (from file times), or about 9 frames per second.

**Render time estimate.** The test scene is simpler than the final video, so the real speed could be half this or worse. The style test will give a real number.

| Render type | Frames to render | At 13.8 fps | At half that speed |
|---|---|---|---|
| No motion blur | 9,148 | 11 min | 22 min |
| 4 blur samples on the 40% of frames that move | about 20,100 | 24 min | 49 min |
| 8 blur samples on those frames | about 34,800 | 42 min | 84 min |

**Disk space is a real limit.** Saving 20,000+ PNG frames at 1–2 MB each would use 20–40 GB of your 44 GB free. The render must stream frames instead of storing them (section 6.5).

## 4. Fact check against Pearson

| Claim in the voiceover | Result |
|---|---|
| 22 question types | **Confirmed by part:** Pearson's format pages list 9 + 5 + 8 = 22, and its 2025 update says "seven of the 22". **Pearson's scoring page says 20**, which looks out of date |
| Seven types double-marked by humans | **Confirmed by Pearson's 2025 update, but the exact seven are not clearly listed.** The tiles stay unnamed |
| AI never replaced by humans on pronunciation and fluency | Confirmed |
| About two hours | Confirmed as Pearson's wording, **but the part times add up to 130–153 minutes.** The graphic says "about 2 hours" and the clock does not claim a precise sweep |
| Must attend a test centre, not at home | Confirmed for PTE Academic |
| Part times 76–84, 23–30, 31–39 minutes | Confirmed |
| Results in 2 business days | Confirmed as "typically". The "up to five" part was not re-checked in this round |
| 4,000+ institutions, country and visa acceptance, 2-year validity | Checked for the previous version, not re-checked in this round |

**Details from Pearson to use in the demos:**
- **Selected options turn yellow** in Reading and Listening, so the new demos use yellow rather than the current blue.
- **Drag and Drop** words sit in a blue box, with more words than gaps.
- **Highlight Incorrect Words** deducts a point for each wrong word.
- **Task timers** can show the real limits:

| Task | Time limit |
|---|---|
| Personal Introduction | 25 s prepare, 30 s record |
| Read Aloud | 30–40 s prepare |
| Repeat Sentence | 15 s answer |
| Describe Image | 25 s study, 40 s answer |
| Retell Lecture | 10 s prepare, 40 s answer |
| Answer Short Question | 10 s answer |
| Summarize Group Discussion | 10 s prepare, 2 min answer |
| Respond to a Situation | 10 s prepare, 40 s answer |
| Summarize Written Text | 10 min, 5–75 words |
| Write Essay | 20 min, 200–300 words |
| Summarize Spoken Text | 10 min, 50–70 words |

**Exam screens are our own design.** They show how the tasks work, without Pearson's logo or a copy of its software. All sample questions are invented.

## 5. Visual system

### 5.1 Look
- **Colour:** keep the white and glass look, with blue `#1A3FC4`, yellow `#F5C518` and orange `#FF8A1F`. Red and green are used only for wrong and right.
- **Fonts:** keep Space Grotesk and Plus Jakarta Sans.
- **Lighting:** one soft light from the top left, so cards, shadows and 3D objects agree.
- **Background:** a pale, deep space with three depth layers, replacing the single dotted plane.

### 5.2 Motion rules

| Motion | Duration | Curve |
|---|---|---|
| Main camera move | 0.8–1.4 s | Slow in, slow out, always with a slight drift afterwards |
| Object entrance | 0.35–0.7 s | Spring with a small overshoot |
| Group stagger | 40–80 ms between items | Fixed order that follows the eye |
| Exit | 60% of the entrance time | Accelerates away, usually with the camera |
| Text reveal | 0.3–0.5 s | Rises from a mask, word by word for titles |
| Line drawing | 0.5–1 s | Eased |
| Idle movement | Continuous | Under 6 px of drift, so it never competes |

**Limits:**
- No more than one main motion and one supporting motion at once.
- A camera move finishes before its key word, so the eye has settled.
- Nothing flashes more than three times per second (the WCAG limit).
- No identical entrance is used twice in a row.

### 5.3 Transition types

| Type | Used for | Example |
|---|---|---|
| Morph | One idea becomes the next | P, T, E blocks become "Pearson Test of English" |
| Fly-through | Going deeper | Camera dives into the computer screen for Part 1 |
| Push and pan | The next item in a list | The next exam task slides into place |
| Pull back | Summing up | The contact scene gathers earlier objects |

The colour wipes in `topLayer()` are removed.

### 5.4 Layers on screen

| Layer | Contents | Moves with the camera? |
|---|---|---|
| 1 | Background and depth plates | Slowly |
| 2 | 3D canvas (Three.js) | Yes, using the same camera path |
| 3 | The HTML world, with cards and exam screens | Yes |
| 4 | Particles | Yes |
| 5 | Logo, progress rail and captions | **No, they stay still and sharp** |

## 6. Technical build

### 6.1 Files
Add `src/ptevo2.html`, `src/ptevo2.css` and `src/ptevo2.js`, so the current version stays as a fallback. They reuse `src/engine.js`, `src/kit.js`, `timeline.js` and `voice.wav`.

Add these only to the video project: `three@0.187.0`, `world-atlas@2.0.2` and `topojson-client`. The Smart Labs website repo is not touched.

### 6.2 Camera
All shots sit at fixed positions in one world div, and the camera is a list of keyframes:

```js
// [time, x, y, z, rotX, rotY, roll, ease]; the world gets the inverse transform each frame.
const CAM = [[20.1, 0, 0, 1200, 0, 0, 0, ez.inOut], [20.9, 3200, 0, 900, -4, 6, 0, ez.inOut]];
```

The same path drives the Three.js camera, so HTML and 3D stay aligned.

**Known browser limits:**
- `opacity`, `filter` and `overflow:hidden` on a parent flatten 3D. These go only on leaf elements.
- Text can blur when scaled by a 3D transform. This gets checked in the style test.
- Shots outside their time window use `display:none`, so the page stays light.

### 6.3 Animation helpers
Add to `src/engine.js`, keeping every frame a pure function of time:
- **`ez.spring`:** a closed-form spring curve, with no stored state, so any frame can be rendered alone.
- **`stagger()`:** offsets a group's start times.
- **`morph(from, to)`:** moves one element between two measured boxes, including size and corner radius, using the existing `lp()`.
- **`draw(path)`:** generalises the `pathLength` line drawing already used on the gauge.
- **`roll(digit)`:** the number roll for counters and the phone number.
- **`maskRise()`:** extends the existing `rise()` in `src/kit.js`.

### 6.4 3D hero objects
Three.js renders into one shared canvas, and only in the hero windows:
- **Globe:** land dots sampled from `world-atlas` by a one-off script. Australia, Canada, New Zealand and the UK can light up separately.
- **P, T, E blocks:** rounded, extruded and bevelled, with the letter on the front face.
- **Score gauge:** a 3D ring with a sweeping needle.
- **Computer and headset:** simple built shapes with no downloaded models.

**Limit:** HTML and 3D layer by stack order only, so an HTML card cannot pass behind a 3D object. Shots are designed around this.

### 6.5 Render pipeline
Changes to `scripts/render.mjs` and `scripts/ptevo.mjs`:
1. **Split into 30-second chunks.** Each worker takes one chunk, on a new browser. This also guards against the Chrome memory growth Remotion warns about on long GPU renders.
2. **Stream frames, with no PNG files.** Each worker pipes frames to ffmpeg and writes one lossless chunk.
3. **Re-render only what changed.** Fixing one shot re-renders only its chunk, which makes revisions much faster.
4. **Join and encode:** join the chunks, then encode with crf 16 and the audio, as now.
5. **Workers:** 4 for chunks with 3D. HTML-only chunks get tested at up to 8.

### 6.6 Motion blur
- **Method:** render several samples within a 180° shutter (half of each frame), then average them. This covers HTML and 3D alike.
- **Samples:** set per shot: 1 on still frames, then 4–8 on moving ones. Pixar's two-sample default relates to its own renderer. Averaged screenshots at 2 samples would show a double image on fast moves, so the style test compares 4 and 8.
- **Alignment:** use the `tmix` fix already found, with a trim, so samples from two frames never mix.

### 6.7 Key-word timing
We have exact times per clip, but not per word. New script `scripts/ptevo-beats.mjs` finds the small pauses inside each clip file, which gives real beats for lists such as "P, T, E" or "speaking, writing, reading and listening". Other words are estimated in proportion to their position, which can be a few tenths of a second off.

## 7. Shot list

Times are exact clip starts from `timeline.js`.

### Hook (0:00–0:20)
| ID | Time | Line | Picture and motion |
|---|---|---|---|
| H1 | 0:00.0 | Studying or working abroad? | 3D globe turns, and a plane draws a glowing route over it. The title rises from a mask |
| H2 | 0:02.6 | Three letters: P, T, E | The route ends, then P, T and E drop as 3D blocks on their spoken beats and settle with a soft shadow |
| H3 | 0:07.6 | What is it, how does it work, how is it scored? | The blocks turn to show a question mark, a computer and a gauge, one for each question |
| H4 | 0:13.3 | From sit down to score | A line draws from a chair to a score of 90 as a preview of the journey |

### What is PTE (0:20–1:07)
| ID | Time | Line | Picture and motion |
|---|---|---|---|
| W1 | 0:20.3 | Pearson Test of English | **Morph:** each block slides and expands into its word |
| W2 | 0:24.0 | Computer-based, four skills | Camera pushes to a 3D computer, then four skill icons draw themselves and orbit it on their spoken beats |
| W3 | 0:34.2 | 4,000+ institutions | The counter rolls and throws dots out onto the globe. Then the four countries light up with labels attached |
| W4 | 0:46.2 | Visas | Camera drops to a passport, and a stamp hits on "visas" with a small shake. Australia and New Zealand are marked |
| W5 | 0:51.3 | Every country and visa differs | One road splits into many branches, each with a different signpost |
| W6 | 0:56.9 | Canada uses PTE Core | Camera follows the Canada branch, where the sign flips to "PTE Core" in orange |
| W7 | 1:03.1 | Check the official requirement | A magnifier sweeps across a document, and a green tick draws itself |

### Format (1:07–1:29)
| ID | Time | Line | Picture and motion |
|---|---|---|---|
| F1 | 1:07.5 | About two hours, test centre | A clock's hand sweeps as "about 2 hours" appears, then the camera pulls back to a test-centre desk |
| F2 | 1:12.8 | Not at home | A small house flies in and a red line draws across it, then it drops away |
| F3 | 1:16.0 | Headset, microphone, type | The headset drops on, a mic wave pulses, and keys press in a wave, each on its word |
| F4 | 1:20.9 | No examiner | An examiner's chair sits opposite. The outline fades and leaves it empty |
| F5 | 1:23.4 | Three parts, 22 types | A bar builds in three coloured sections, as 22 ticks stagger in and the count rolls up |
| F6 | 1:27.4 | Walk through them | **Fly-through:** the camera dives into the monitor, and the screen fills the frame |

### Part 1: Speaking and Writing (1:29–2:32)
Everything from here to 3:45 happens on one full-size exam screen. A rail shows the tasks, and a cursor does the actions. The camera pushes in on whichever part matters.

| ID | Time | Task | Demonstration |
|---|---|---|---|
| P1.0 | 1:29.3 | Part 1 title, 76–84 min | The Part 1 section of the bar expands to fill the screen as the time rolls in. It is visibly the longest section |
| P1.1 | 1:35.9 | Personal Introduction | Webcam outline, with a "Not scored" stamp that lands on the words |
| P1.2 | 1:39.8 | Speaking tasks begin | A mic lights up and the rail's speaking group highlights |
| P1.3 | 1:42.3 | Read Aloud | Words light up left to right as a waveform follows |
| P1.4 | 1:45.9 | Repeat Sentence | A wave flows from a speaker into the student and back out of the mic. The two wave shapes match |
| P1.5 | 1:50.6 | Describe Image | A chart builds, then a 25 s ring and a 40 s ring appear as they're spoken |
| P1.6 | 1:57.4 | Retell Lecture | A lecture slide plays, and key points fly out into a note. A new wave comes back |
| P1.7 | 2:02.4 | Answer Short Question | A question appears, and a single short answer bubble pops |
| P1.8 | 2:06.3 | Summarize Group Discussion | Three speaker bubbles alternate, then merge into one summary. "New" tag |
| P1.9 | 2:13.2 | Respond to a Situation | An everyday situation card turns, and a speech bubble grows from it. "New" tag |
| P1.10 | 2:19.3 | Then you write | **Fix:** a keyboard rises as the mic slides away, and the rail moves to writing |
| P1.11 | 2:20.6 | Summarize Written Text | A passage collapses line by line into one sentence, and a 10-minute timer appears |
| P1.12 | 2:26.7 | Write Essay | Lines type in as the counter climbs to 200–300, with a 20-minute timer |

### Part 2: Reading (2:32–3:01)
| ID | Time | Task | Demonstration |
|---|---|---|---|
| P2.0 | 2:32.7 | Part 2 title, 23–30 min | The camera pans along the bar to Part 2, and 5 ticks light up |
| P2.1 | 2:38.7 | Dropdown | The cursor clicks a gap, a menu springs open, and the word drops in |
| P2.2 | 2:43.4 | Drag and Drop | The cursor lifts a word from a blue box with a shadow, then it snaps into the gap. A spare word stays behind |
| P2.3 | 2:46.1 | Multiple choice | A single choice turns yellow, then a second screen shows several options selected |
| P2.4 | 2:51.5 | Wrong selections cost points | The camera pushes in. A wrong tick shakes red and "−1" floats up |
| P2.5 | 2:56.3 | Reorder Paragraph | Mixed-up boxes lift and swap, then lock into order |

### Part 3: Listening (3:02–3:45)
| ID | Time | Task | Demonstration |
|---|---|---|---|
| P3.0 | 3:02.1 | Part 3 title, 31–39 min | The camera pans on to Part 3, and 8 ticks light up |
| P3.1 | 3:08.2 | Summarize Spoken Text | Audio plays, words flow into a box, and the counter climbs to 50–70 |
| P3.2 | 3:14.1 | Multiple choice | Options appear beside a playing audio bar, and two versions flip past |
| P3.3 | 3:16.5 | Fill in the Blanks | The cursor jumps from gap to gap, typing as the audio bar moves |
| P3.4 | 3:20.7 | Highlight Correct Summary | Three paragraphs stack, then two dim and one lifts forward in yellow |
| P3.5 | 3:26.3 | Select Missing Word | The waveform runs and is cut by a visible and **audible** beep, and options appear |
| P3.6 | 3:33.3 | Highlight Incorrect Words | A playhead moves along the text, and differing words get clicked |
| P3.7 | 3:39.1 | Write from Dictation | A short wave plays, then the sentence types out exactly |

### Scoring (3:45–4:18)
| ID | Time | Line | Picture and motion |
|---|---|---|---|
| S1 | 3:45.7 | Now, scoring | **Pull back** out of the screen, which flies off to become a dot on the 3D gauge |
| S2 | 3:47.5 | 10 to 90, four skill scores | The needle sweeps to 90 as the number rolls, then four skill bars branch from the gauge |
| S3 | 3:55.5 | AI first | A scan beam passes over stacked answers, and each gets a tick |
| S4 | 3:58.8 | 7 of 22 double-marked | A 22-tile grid appears, and 7 unnamed tiles flip to show a person icon |
| S5 | 4:04.1 | Pronunciation and fluency never human | A waveform is locked behind an AI badge, and the person icon is crossed out |
| S6 | 4:08.9 | 2 business days, up to 5 | Calendar days tick to day 2 in blue, then a lighter marker continues to day 5 |
| S7 | 4:14.4 | Valid two years | A timeline draws from "test date" to a two-year marker, with the months ticking past |

### Prepare (4:18–4:42)
| ID | Time | Line | Picture and motion |
|---|---|---|---|
| R1 | 4:18.6 | How should you prepare? | A path draws upward across the screen |
| R2 | 4:20.6 | Three things | Three checkpoints stagger in along it |
| R3 | 4:21.9 | Learn every type | Camera moves to checkpoint 1, and all 22 tiles fall into neat groups |
| R4 | 4:28.3 | Computer, headset, timed | Camera moves to checkpoint 2. The computer and headset return with a timer |
| R5 | 4:36.2 | Full mock tests | Camera moves to checkpoint 3. Skill bars show one weak skill, which gets highlighted |

Weak-skill bars have no scores on them, and nothing suggests a guaranteed result.

### Contact (4:42–5:05)
| ID | Time | Line | Picture and motion |
|---|---|---|---|
| C1 | 4:42.4 | Smart Labs: classes, AI practice, mocks | **Pull back:** earlier objects drift together as the logo resolves, then three labels attach to it |
| C2 | 4:50.6 | Call | Digits roll into `070 691 4652`, grouped by the spoken beats |
| C3 | 4:56.9 | smartlabs.lk | The address draws in with a soft sweep of light |
| C4 | 4:59.5–5:05 | End hold | Logo, phone and website hold still and readable, with the music rising |

## 8. Sound

- **New effects** in `scripts/synth.mjs`: key clicks, cursor clicks, stamp, scan sweep, tick, camera air movement and the exam beep.
- **Timing:** effects come from the same animation cues, so they stay in sync automatically.
- **Levels:** under the voice, with a limit on how many play at once. Exam key clicks stay quiet.
- **Music:** the same 4-chord loop now runs for 5 minutes. `song()` will vary by section, with lighter drums during exam demos, a lift at scoring and a resolved ending.
- **Unchanged:** the voice is ducked over music as now, with a target of about −16 LUFS.

## 9. Build stages

Each stage ends with a check, and the first needs your approval. The time guesses are rough.

| Stage | Work | Result | Rough time |
|---|---|---|---|
| **0. Style test** | Camera, helpers, chunked render, 3D, shots H1–H4 and W1 | **A 25-second clip for you to approve**, plus real render speed | 1.5–2.5 h |
| 1. Overview | Remaining W and F shots | The first 1:29 | 1–1.5 h |
| 2. Exam screens | Parts 1, 2 and 3, the largest stage | 1:29–3:45 | 1.5–3 h |
| 3. Scoring to contact | S, R and C shots | The full picture | 1–1.5 h |
| 4. Sound and final | Effects, music, full render and checks | Final video and chapter list | 1–2 h, mostly render time |

## 10. Checks

**Automatic:**
- `voice.wav` and `timeline.js` hashes match the verified versions.
- `scripts/ptevo-sync.mjs` passes on the voice track.
- A browser check flags any text outside its box or the safe area, or anything covering the captions, at each shot's start, middle and end.
- Chunk joins are compared frame by frame for jumps.
- Final loudness, resolution, length and stereo are measured from the finished file.

**By looking at frames:**
- A contact sheet for each shot, at the start of its line, its key word and its end.
- Motion checks on short frame sequences for ghosting, jumps and blurry text.
- A phone-size check that captions and labels stay readable.

**What I can't check:** I can't hear audio or judge how motion feels when played. Your review with sound stays the final check.

## 11. Risks

| Risk | Likelihood | Plan if it happens |
|---|---|---|
| The result feels busy and distracts from learning | Medium | Follow the motion limits, and review the style test early |
| 3D and HTML look like two different styles | Medium | Use shared light, colour and soft shadows, and check in the style test |
| Text blurs under the camera | Medium | Move text out of the 3D transform for those moments |
| Render is slower than estimated | Medium | Use fewer blur samples, or limit blur to camera moves |
| Intel GPU crashes or Chrome runs out of memory on long runs | Low to medium | Chunks restart independently and resume |
| Disk fills up | Low with streaming | Check free space before each render and delete old chunks |
| Key-word timing is off between pauses | Medium | Use clip pauses where they exist, and keep reveals slightly early |
| Pearson changes the facts later | Low | Facts sit in simple text and can be changed with a re-render, but changing the voice needs new clips |

## 12. Decisions for you

| Decision | Recommendation | Why |
|---|---|---|
| **Look** | Keep white and glass | Matches your other videos, though dark would make light effects stand out more |
| **Voice** | Keep the current voice | Regenerating would change every clip time and repeat the sync checks. If you want the newer model, decide before stage 2 |
| **Frame rate** | 30 fps with motion blur | A more cinematic look at a manageable render time. 60 fps would look sharper but would need twice the frames, on top of any blur |
| **Length and script** | No changes | Keeps the verified voice timing |

## 13. Sources

**PTE facts (Pearson)**
- [Test format: Speaking and Writing](https://www.pearsonpte.com/pte-academic/test-format/speaking-writing)
- [Test format: Reading](https://www.pearsonpte.com/pte-academic/test-format/reading)
- [Test format: Listening](https://www.pearsonpte.com/pte-academic/test-format/listening)
- [PTE scoring](https://www.pearsonpte.com/scoring)
- [PTE changes 2025](https://www.pearsonpte.com/articles/pte-changes-2025-everything-you-need-to-know/)
- [PTE Academic general FAQs](https://www.pearsonpte.com/help-center/general-faqs/pte-academic/)

**Learning research**
- [Mayer: principles for reducing extraneous processing, Cambridge Handbook of Multimedia Learning](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/CD5B7AE1279A9AB81F8EEBB53DBEC86E)
- [Mayer 2017: Using multimedia for e-learning](https://zendy.io/title/10.1111/jcal.12197)
- [Guo, Kim and Rubin 2014: How video production affects student engagement](https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf)
- [Montero Perez et al. 2013, summary of the captions meta-analysis](https://www.hkmu.edu.hk/static_content/icofe2016/abs/066.html). I read only the abstract-level summary

**Motion and rendering**
- [Creative Bloq: designing interface animations](https://www.creativebloq.com/web-design/beginners-guide-designing-interface-animations-61617793)
- [ProVideo Coalition: motion blur](https://www.provideocoalition.com/motion_blur/)
- [Pixar RenderMan: motion blur](https://rmanwiki.pixar.com/x/13AGC)
- [Remotion: GPU in headless Chrome](https://remotion-kq1j7ragi-remotion.vercel.app/docs/gpu)
- [Remotion: gpu command](https://www.remotion.dev/docs/cli/gpu)
- [Microlink: WebGL without a GPU](https://microlink.io/blog/webgl-without-a-gpu)
