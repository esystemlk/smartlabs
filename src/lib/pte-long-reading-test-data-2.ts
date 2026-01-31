
import { PteQuestion } from './pte-long-reading-test-data';

export const pteLongReadingTestData2: { title: string; questions: PteQuestion[] } = {
    title: "PTE Reading Practice Test 2",
    questions: [
        {
            id: 't2q1',
            type: 'fill-in-the-blanks-rw',
            passage: `Since the introduction of digital technology, many {BLANK} have been {BLANK} to improve the efficiency and security of online communication systems. While some innovations were widely adopted, others failed to gain public {BLANK} because they were considered too complex or unnecessary. Experts argue that the most successful systems are those that remain simple, {BLANK}, and accessible to users of all ages.`,
            blanks: [
                { options: ['proposals', 'assumptions', 'debates', 'essays'], correctAnswer: 'proposals' },
                { options: ['offered', 'rejected', 'overthrown', 'expected'], correctAnswer: 'offered' },
                { options: ['acceptance', 'accepting', 'accepted', 'accept'], correctAnswer: 'acceptance' },
                { options: ['reliable', 'portable', 'strict', 'abnormal'], correctAnswer: 'reliable' },
            ]
        },
        {
            id: 't2q2',
            type: 'fill-in-the-blanks-rw',
            passage: `University libraries are designed to be quiet spaces that support learning and research. Students are {BLANK} to follow rules regarding noise levels and phone use. These policies are {BLANK} to create an environment where everyone can concentrate. Librarians also follow clear {BLANK} to ensure fair access to study rooms and resources. Anyone who disrupts others may be asked to leave to maintain a {BLANK} atmosphere.`,
            blanks: [
                { options: ['required', 'qualified', 'capable', 'allowed'], correctAnswer: 'required' },
                { options: ['intended', 'failed', 'likely', 'used'], correctAnswer: 'intended' },
                { options: ['procedures', 'stages', 'necessities', 'steps'], correctAnswer: 'procedures' },
                { options: ['neutral', 'calm', 'supportive', 'natural'], correctAnswer: 'calm' },
            ]
        },
        {
            id: 't2q3',
            type: 'fill-in-the-blanks-rw',
            passage: `Early maps were often based on explorers’ stories rather than precise measurement. Over time, improvements in navigation tools {BLANK} more accurate representations of coastlines and continents. Ancient Greek scholars {BLANK} geographical knowledge into written texts, which later scholars studied and expanded. One famous map from the 2nd century still {BLANK} today as evidence of early scientific thinking. These works {BLANK} future discoveries and encouraged generations of explorers to travel further.`,
            blanks: [
                { options: ['allowed', 'prevented', 'denied', 'forced'], correctAnswer: 'allowed' },
                { options: ['translated', 'recorded', 'removed', 'interpreted'], correctAnswer: 'recorded' },
                { options: ['survives', 'remains', 'suffers', 'leaves'], correctAnswer: 'survives' },
                { options: ['inspired', 'simulated', 'stimulated', 'guided'], correctAnswer: 'inspired' },
            ]
        },
        {
            id: 't2q4',
            type: 'fill-in-the-blanks-rw',
            passage: `Many people enjoy learning about the origins of words, yet they often feel {BLANK} when language changes in modern times. Linguists explain that language naturally evolves as society and technology develop. However, some critics are {BLANK} that new forms of communication, such as texting, are damaging grammar. Experts argue that English is not being destroyed but simply {BLANK} over time. These changes reflect creativity rather than decline and should be viewed as part of the language’s {BLANK} history.`,
            blanks: [
                { options: ['curious', 'worried', 'excited', 'scared'], correctAnswer: 'curious' },
                { options: ['convinced', 'satisfied', 'reassured', 'persuaded'], correctAnswer: 'convinced' },
                { options: ['adapting', 'weakening', 'disappearing', 'reducing'], correctAnswer: 'adapting' },
                { options: ['rich', 'limited', 'unclear', 'damaged'], correctAnswer: 'rich' },
            ]
        },
        {
            id: 't2q5',
            type: 'fill-in-the-blanks-rw',
            passage: `A private space company successfully launched its latest rocket from a coastal site, marking a major step in commercial space travel. The rocket carried an uncrewed {BLANK} of a reusable spacecraft designed to transport astronauts in the future. Engineers described the launch as an {BLANK} achievement for the national space program. If the vehicle reached {BLANK} safely, the mission would be considered a success. The company hopes to secure a government {BLANK} to provide future transport services, especially as older spacecraft are scheduled to {BLANK} within the next decade.`,
            blanks: [
                { options: ['model', 'mockup', 'version', 'setup'], correctAnswer: 'mockup' },
                { options: ['encouraging', 'rapid', 'hopeful', 'promising'], correctAnswer: 'promising' },
                { options: ['orbit', 'path', 'track', 'route'], correctAnswer: 'orbit' },
                { options: ['contract', 'support', 'trust', 'arrangement'], correctAnswer: 'contract' },
                { options: ['retire', 'resign', 'stop', 'pause'], correctAnswer: 'retire' },
            ]
        },
        {
            id: 't2q6',
            type: 're-order-paragraphs',
            title: 'Conservation Efforts',
            paragraphs: [
                "Some species receive more attention simply because they appear attractive or rare.",
                "Conservation efforts often depend on public interest and emotional response.",
                "However, less visible organisms like insects play equally important ecological roles.",
                "Scientists argue that biodiversity protection should focus on ecosystem balance, not popularity."
            ],
            correctOrder: [
                "Conservation efforts often depend on public interest and emotional response.",
                "Some species receive more attention simply because they appear attractive or rare.",
                "However, less visible organisms like insects play equally important ecological roles.",
                "Scientists argue that biodiversity protection should focus on ecosystem balance, not popularity."
            ]
        },
        {
            id: 't2q7',
            type: 're-order-paragraphs',
            title: 'Railway Development',
            paragraphs: [
                "Over time, metal rails replaced wooden tracks.",
                "Early railways were made of wood and used for transporting goods.",
                "These developments improved safety and efficiency.",
                "Industrial growth led to the invention of steel railways."
            ],
            correctOrder: [
                "Early railways were made of wood and used for transporting goods.",
                "Industrial growth led to the invention of steel railways.",
                "Over time, metal rails replaced wooden tracks.",
                "These developments improved safety and efficiency."
            ]
        },
        {
            id: 't2q8',
            type: 're-order-paragraphs',
            title: 'Exam Strategy',
            paragraphs: [
                "This helps you focus only on relevant information.",
                "Many students struggle to achieve high exam scores.",
                "Before answering, understand exactly what the question asks.",
                "Planning your answer ensures clarity and structure.",
                "As a result, your responses will be more organized."
            ],
            correctOrder: [
                "Many students struggle to achieve high exam scores.",
                "Before answering, understand exactly what the question asks.",
                "This helps you focus only on relevant information.",
                "Planning your answer ensures clarity and structure.",
                "As a result, your responses will be more organized."
            ]
        },
        {
            id: 't2q9',
            type: 'fill-in-the-blanks-r',
            passage: 'Modern digital art installations can be enormous; {BLANK}, the ideas behind them often come from simple artistic traditions. Many artists find inspiration in animation and comics, noticing elements they share {BLANK}. Scientific training sometimes influences these artists {BLANK} traditional artistic techniques. {BLANK} Western art often focuses on realistic perspective, some Asian traditions use alternative spatial methods.',
            wordBank: ['however', 'in common', 'along with', 'while'],
            correctWords: ['however', 'in common', 'along with', 'while']
        },
        {
            id: 't2q10',
            type: 'fill-in-the-blanks-r',
            passage: 'Life expectancy measures how long people live rather {BLANK} their quality of life. A combined measure of lifespan and wellbeing would be more {BLANK}, but no universal system currently exists. {BLANK} the past decade, improvements have been observed in many countries. The {BLANK} between male and female life expectancy has gradually narrowed.',
            wordBank: ['than', 'desirable', 'over', 'gap'],
            correctWords: ['than', 'desirable', 'over', 'gap']
        },
        {
            id: 't2q11',
            type: 'fill-in-the-blanks-r',
            passage: 'Because scientific knowledge evolves, we must update our dietary {BLANK} regularly. Nutrition is both an art and a {BLANK}, requiring creativity and evidence-based knowledge. As researchers learn how genes and environment {BLANK}, it becomes harder to create guidelines that are {BLANK} for everyone.',
            wordBank: ['recommendations', 'science', 'interact', 'suitable'],
            correctWords: ['recommendations', 'science', 'interact', 'suitable']
        },
        {
            id: 't2q12',
            type: 'fill-in-the-blanks-r',
            passage: 'Voters like to believe their decisions are rational. {BLANK}, studies suggest that appearance influences voting behavior. Candidates judged as competent-looking often perform better in elections, even when there is little evidence {BLANK} looks and ability truly {BLANK}.',
            wordBank: ['in truth', 'as', 'correlate'],
            correctWords: ['in truth', 'as', 'correlate']
        }
    ]
};
