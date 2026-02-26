export const LEVEL_TEST_DATA = {
    grammar: [
        { id: 1, question: "She usually ____ to work early.", options: ["go", "goes", "went", "going"], answer: "B" },
        { id: 2, question: "They ____ dinner when I arrived.", options: ["have", "were having", "had", "having"], answer: "B" },
        { id: 3, question: "He ____ in this company since 2021.", options: ["works", "worked", "has worked", "working"], answer: "C" },
        { id: 4, question: "If I ____ more time, I would study English.", options: ["have", "had", "will have", "having"], answer: "B" },
        { id: 5, question: "By next year, she ____ her degree.", options: ["completes", "completed", "will complete", "will have completed"], answer: "D" },
        { id: 6, question: "We ____ the project yesterday.", options: ["finish", "finished", "finishing", "finishes"], answer: "B" },
        { id: 7, question: "I ____ English at the moment.", options: ["study", "studied", "am studying", "studies"], answer: "C" },
        { id: 8, question: "You ____ wear a helmet while riding.", options: ["should", "should to", "must to", "can to"], answer: "A" },
        { id: 9, question: "He is interested ____ technology.", options: ["in", "on", "at", "for"], answer: "A" },
        { id: 10, question: "She speaks English very ____.", options: ["good", "well", "better", "best"], answer: "B" },
    ],
    vocabulary: [
        { id: 11, question: "Education plays a vital role in economic ______.", options: ["development", "damage", "failure", "loss"], answer: "A" },
        { id: 12, question: "Pollution has a negative ______ on health.", options: ["effect", "success", "benefit", "growth"], answer: "A" },
        { id: 13, question: "Online learning provides greater ______.", options: ["flexibility", "difficulty", "danger", "confusion"], answer: "A" },
        { id: 14, question: "The government should ______ new policies.", options: ["implement", "break", "avoid", "remove"], answer: "A" },
        { id: 15, question: "Climate change is a global ______.", options: ["issue", "chance", "hobby", "method"], answer: "A" },
    ],
    spelling: [
        { id: 16, word: "Enviroment", answer: "Environment" },
        { id: 17, word: "Goverment", answer: "Government" },
        { id: 18, word: "Acheive", answer: "Achieve" },
        { id: 19, word: "Developement", answer: "Development" },
        { id: 20, word: "Knowlege", answer: "Knowledge" },
    ],
    sentenceConstruction: [
        { id: 21, task: "One simple sentence about education." },
        { id: 22, task: "One compound sentence using and/but/so." },
        { id: 23, task: "One complex sentence using because/although." },
        { id: 24, task: "One result sentence using therefore/as a result." },
        { id: 25, task: "One academic opinion about technology or education." },
    ],
    reading: {
        passage: `Online learning has become increasingly popular in recent years. Many universities and training institutions now provide digital courses that allow students to study from any location. This method of learning offers significant flexibility, especially for working adults who need to manage both employment and education.\n\nOne major advantage of online education is that learners can control their study schedule. They can review lessons multiple times and learn at their own pace. However, online learning also presents challenges. Some students find it difficult to stay motivated without direct classroom interaction. In addition, technical problems such as poor internet connections may interrupt learning.\n\nDespite these difficulties, research shows that well-designed online courses can be as effective as traditional classroom learning. Experts believe that online education will continue to expand as technology improves.`,
        questions: [
            { id: 26, question: "What is the main benefit of online learning?", options: ["Lower cost", "Flexibility", "Shorter courses", "Easy exams"], answer: "B" },
            { id: 27, question: "Who benefits most?", options: ["Children", "Teachers", "Working adults", "Retired people"], answer: "C" },
            { id: 28, question: "Students can study at their own pace.", type: "TFNG", answer: "True" },
            { id: 29, question: "Poor internet can affect learning.", type: "TFNG", answer: "True" },
            { id: 30, question: "All universities only offer online courses.", type: "TFNG", answer: "False" },
            { id: 31, question: "Online learning is always better than classroom learning.", type: "TFNG", answer: "Not Given" },
            { id: 32, question: "Online courses are never effective.", type: "TFNG", answer: "False" },
            { id: 33, question: "Students can review lessons many times.", type: "TFNG", answer: "True" },
            { id: 34, question: "Motivation can be a problem.", type: "TFNG", answer: "True" },
            { id: 35, question: "Online education will decrease in the future.", type: "TFNG", answer: "False" },
        ]
    },
    speaking: [
        {
            id: 36,
            type: "read-aloud",
            text: "Students should study regularly to improve their speaking skills. Strong practice helps them speak clearly and confidently. Starting early allows students to succeed in academic and professional environments."
        },
        {
            id: 37,
            type: "speech",
            task: "Why is English important for your career?",
            duration: "30-40 seconds"
        }
    ]
};
