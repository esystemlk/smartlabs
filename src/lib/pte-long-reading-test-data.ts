export interface FillInTheBlanksRW {
  type: 'fill-in-the-blanks-rw';
  id: string;
  passage: string; // with {BLANK}
  blanks: {
    options: string[];
    correctAnswer: string;
  }[];
}

export interface ReorderParagraphs {
  type: 're-order-paragraphs';
  id: string;
  title: string;
  paragraphs: string[];
  correctOrder: string[];
}

export interface FillInTheBlanksReading {
    type: 'fill-in-the-blanks-r';
    id: string;
    passage: string; // with {BLANK}
    wordBank: string[];
    correctWords: string[];
}

export type PteQuestion = FillInTheBlanksRW | ReorderParagraphs | FillInTheBlanksReading;

export interface PteLongReadingTest {
    title: string;
    questions: PteQuestion[];
}

export const pteLongReadingTestData: PteLongReadingTest = {
    title: "PTE Reading Practice Test – Long Version (10 Questions)",
    questions: [
        {
            id: 'q1',
            type: 'fill-in-the-blanks-rw',
            passage: `A recent study at Oxford University explored how individuals anticipate happiness in their daily lives. Researchers discovered that asking someone else about their experiences is often more {BLANK} than relying solely on self-prediction. In the study, participants were asked to rate their anticipated enjoyment of a variety of activities, from reading novels to attending social gatherings. The results revealed that people consistently {BLANK} the future, often overestimating or underestimating their emotional responses. This discrepancy {BLANK} them to make decisions that do not align with their true preferences. Attempts at {BLANK} the accuracy of such predictions through cognitive training have largely been unsuccessful, highlighting the complexity of human decision-making.`,
            blanks: [
                { options: ['Accurate', 'informative', 'positive', 'predictable'], correctAnswer: 'Accurate' },
                { options: ['Imagining', 'predicting', 'visualizing', 'imitating'], correctAnswer: 'Imagining' },
                { options: ['Leads', 'forces', 'compels', 'drives'], correctAnswer: 'Leads' },
                { options: ['Improving', 'advancing', 'controlling', 'enhancing'], correctAnswer: 'Improving' }
            ]
        },
        {
            id: 'q2',
            type: 'fill-in-the-blanks-rw',
            passage: `At the Massachusetts Institute of Technology, engineers have turned to nature to inspire new drone designs. Observing the flight of dragonflies, they noticed that these insects achieve incredible stability and maneuverability without relying on large energy inputs. Conventional drones have a {BLANK} design that makes them inefficient at low speeds, {BLANK} them to expend excessive energy simply maintaining balance. By analyzing the precise movements of dragonfly wings using high-speed cameras, the research team realized that nature {BLANK} an elegant solution. The elongated wing shape {BLANK} the insects to hover, turn rapidly, and conserve energy. Using these insights, engineers were able to {BLANK} a prototype micro-drone capable of agile flight even in confined spaces.`,
            blanks: [
                { options: ['Complex', 'intricate', 'cumbersome', 'robust'], correctAnswer: 'Complex' },
                { options: ['Forcing', 'denying', 'preventing', 'proving'], correctAnswer: 'Forcing' },
                { options: ['Provided', 'offered', 'denied', 'led'], correctAnswer: 'Provided' },
                { options: ['Allows', 'enables', 'pushes', 'hampers'], correctAnswer: 'Allows' },
                { options: ['Build', 'construct', 'spin', 'fabricate'], correctAnswer: 'Build' }
            ]
        },
        {
            id: 'q3',
            type: 'fill-in-the-blanks-rw',
            passage: `Active learning apps and educational games are becoming increasingly popular as a method to {BLANK} student engagement and improve cognitive outcomes. A recent review of 15 studies assessed the extent to which interactive applications could increase attention spans, knowledge retention, and overall participation. Eight studies focused specifically on the apps as an {BLANK} to support classroom instruction, while others evaluated their standalone impact. Compared to traditional teaching methods, these apps were found to {BLANK} higher levels of engagement, motivation, and interest in the subject matter. Despite promising results, methodological limitations such as small sample sizes and short study durations prevent {BLANK} conclusions. Long-term research is needed to determine whether these technologies are effective in {BLANK} consistent learning habits over time.`,
            blanks: [
                { options: ['Promote', 'obstruct', 'examine', 'enhance'], correctAnswer: 'Promote' },
                { options: ['Intervention', 'tool', 'resource', 'experiment'], correctAnswer: 'Intervention' },
                { options: ['Generate', 'elicit', 'reduce', 'consume'], correctAnswer: 'Elicit' },
                { options: ['Definitive', 'reliable', 'positive', 'optimal'], correctAnswer: 'Definitive' },
                { options: ['Supporting', 'promoting', 'encouraging', 'assessing'], correctAnswer: 'Supporting' }
            ]
        },
        {
            id: 'q4',
            type: 'fill-in-the-blanks-rw',
            passage: `A giant sculpture of a humpback whale made entirely from recycled metal will be displayed at the Beijing Science Festival. The materials were collected locally from communities and were {BLANK} commissioned to raise awareness about the global threat of marine pollution. Plastic waste, oil spills, and climate change are {BLANK} affecting marine ecosystems, and humans have a duty to protect the species we {BLANK} our planet. The whale sculpture is not only a {BLANK} of the environmental crisis but also a reminder that small individual actions, such as reducing plastic use, can make a difference. Organizers hope that visitors will reflect on their own behavior and consider more {BLANK} ways of living to reduce environmental harm.`,
            blanks: [
                { options: ['Was', 'is', 'has', 'have'], correctAnswer: 'Was' },
                { options: ['Already', 'yet', 'only', 'otherwise'], correctAnswer: 'Already' },
                { options: ['Call', 'settle', 'own', 'protect'], correctAnswer: 'Own' },
                { options: ['Reminder', 'recognition', 'receipt', 'reinforcement'], correctAnswer: 'Reminder' },
                { options: ['Sustainable', 'constructive', 'careful', 'optimal'], correctAnswer: 'Sustainable' }
            ]
        },
        {
            id: 'q5',
            type: 'fill-in-the-blanks-rw',
            passage: `Delegation is a key management skill that involves planning, briefing, and follow-up. At each stage, it is crucial to {BLANK} potential problems and anticipate obstacles before they arise. When delegating, managers assign the {BLANK} to act, rather than removing responsibility entirely. Leaders should remain {BLANK} and open to alternative methods, as team members may have more efficient or innovative approaches to completing tasks. Despite delegation, the {BLANK} responsibility remains with the manager, and it is important to provide {BLANK} feedback to guide improvements and ensure quality outcomes. Effective delegation can improve productivity, enhance employee development, and {BLANK} organizational efficiency over time.`,
            blanks: [
                { options: ['Anticipate', 'learn', 'summarize', 'think'], correctAnswer: 'Anticipate' },
                { options: ['Action', 'task', 'exercise', 'execution'], correctAnswer: 'Action' },
                { options: ['Flexible', 'clever', 'adaptable', 'smart'], correctAnswer: 'Flexible' },
                { options: ['Overall', 'major', 'complete', 'final'], correctAnswer: 'Overall' },
                { options: ['Constructive', 'detailed', 'critical', 'comprehensive'], correctAnswer: 'Constructive' },
                { options: ['Enhance', 'increase', 'improve', 'promote'], correctAnswer: 'Enhance' }
            ]
        },
        {
            id: 'q6',
            type: 're-order-paragraphs',
            title: 'Question 6: Re-Order Paragraphs',
            paragraphs: [
                "He faced multiple relocations that interrupted his education.",
                "This child, only 10 years old, had been adopted by several families.",
                "His social relationships suffered due to constant changes.",
                "Eventually, he was placed with relatives who tried to provide stability.",
                "These early experiences resulted in academic and emotional challenges."
            ],
            correctOrder: [
                "This child, only 10 years old, had been adopted by several families.",
                "He faced multiple relocations that interrupted his education.",
                "Eventually, he was placed with relatives who tried to provide stability.",
                "His social relationships suffered due to constant changes.",
                "These early experiences resulted in academic and emotional challenges."
            ]
        },
        {
            id: 'q7',
            type: 're-order-paragraphs',
            title: 'Question 7: Re-Order Paragraphs',
            paragraphs: [
                "Taking detailed notes helps students remember key information.",
                "After lectures, reviewing notes reinforces learning and consolidates knowledge.",
                "Active listening in class is essential to capture important ideas.",
                "Organizing notes in a systematic manner improves understanding and recall."
            ],
            correctOrder: [
                "Active listening in class is essential to capture important ideas.",
                "Organizing notes in a systematic manner improves understanding and recall.",
                "Taking detailed notes helps students remember key information.",
                "After lectures, reviewing notes reinforces learning and consolidates knowledge."
            ]
        },
        {
            id: 'q8',
            type: 're-order-paragraphs',
            title: 'Question 8: Re-Order Paragraphs',
            paragraphs: [
                "The Arctic is warming at an unprecedented rate, affecting global climate patterns.",
                "Melting ice and shifting wildlife populations indicate dramatic ecosystem changes.",
                "These environmental changes impact local communities and industries, including tourism and fishing.",
                "The response of Arctic ecosystems to climate change will influence the planet’s overall climate stability."
            ],
            correctOrder: [
                "The Arctic is warming at an unprecedented rate, affecting global climate patterns.",
                "Melting ice and shifting wildlife populations indicate dramatic ecosystem changes.",
                "The response of Arctic ecosystems to climate change will influence the planet’s overall climate stability.",
                "These environmental changes impact local communities and industries, including tourism and fishing."
            ]
        },
        {
            id: 'q9',
            type: 'fill-in-the-blanks-r',
            passage: `The poem “The Choice of Paths” explores the {BLANK} individuals face in life. The traveler comes to a {BLANK} where multiple paths meet, feeling {BLANK} that both cannot be taken simultaneously. The decision made at this point determines the {BLANK} the traveler will follow and influences future experiences. Frost uses this metaphor to show how choices shape our {BLANK} and identity over time.`,
            wordBank: ['Choices', 'fork', 'sorry', 'direction', 'journey'],
            correctWords: ['Choices', 'fork', 'sorry', 'direction', 'journey']
        },
        {
            id: 'q10',
            type: 'fill-in-the-blanks-r',
            passage: `Barcelona is a vibrant and {BLANK} city that attracts millions of tourists annually. Its combination of {BLANK} architecture, {BLANK} beaches, and lively cultural events makes it a top destination. The city is highly {BLANK} and becomes even more {BLANK} during festivals and summer holidays, providing visitors with an immersive experience of local life, art, and cuisine.`,
            wordBank: ['Bustling', 'stunning', 'sandy', 'cosmopolitan', 'crowded'],
            correctWords: ['Bustling', 'stunning', 'sandy', 'cosmopolitan', 'crowded']
        }
    ]
};
