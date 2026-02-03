export const pteSpeakingData = {
    'read-aloud': [
        {
            id: 1,
            text: "The concept of 'smart cities' is a topic of increasing interest. A smart city uses information and communication technology (ICT) to improve operational efficiency and provide a better quality of government service and citizen welfare.",
            topic: "Technology"
        },
        {
            id: 2,
            text: "Climate change is one of the most pressing challenges of our time. It refers to long-term shifts in temperatures and weather patterns, mainly caused by human activities such as burning fossil fuels and deforestation.",
            topic: "Environment"
        },
        {
            id: 3,
            text: "Higher education provides students with the opportunity to develop specialized knowledge and skills in their chosen field. It also fosters critical thinking and problem-solving abilities that are essential in the modern workforce.",
            topic: "Education"
        },
        {
            id: 4,
            text: "The global economy is a complex system of interconnected markets and financial institutions. Economic growth depends on various factors, including technological innovation, investment, and government policies.",
            topic: "Economics"
        },
        {
            id: 5,
            text: "Effective communication is vital in both personal and professional relationships. It involves not only expressing oneself clearly but also listening actively to others and understanding their perspectives.",
            topic: "Communication"
        }
    ],
    'repeat-sentence': [
        { id: 1, sentence: "The library will be closed for renovations during the summer break.", audio: '/audio/pte/rs-1.mp3' },
        { id: 2, sentence: "Please submit your assignments before the deadline on Friday.", audio: '/audio/pte/rs-2.mp3' },
        { id: 3, sentence: "The professor will hold office hours every Monday afternoon.", audio: '/audio/pte/rs-3.mp3' },
        { id: 4, sentence: "Innovation is key to maintaining a competitive edge in the industry.", audio: '/audio/pte/rs-4.mp3' },
        { id: 5, sentence: "Students are encouraged to participate in extracurricular activities.", audio: '/audio/pte/rs-5.mp3' }
    ],
    'describe-image': [
        { id: 1, type: 'Graph', imageUrl: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=800', prompt: 'Describe this bar chart showing population growth.' },
        { id: 2, type: 'Map', imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=800', prompt: 'Describe this map of global trade routes.' },
        { id: 3, type: 'Process', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800', prompt: 'Describe the manufacturing process shown in the image.' },
        { id: 4, type: 'Table', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800', prompt: 'Describe the data presented in this table.' },
        { id: 5, type: 'Pie Chart', imageUrl: 'https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=800', prompt: 'Describe the distribution shown in this pie chart.' }
    ],
  'retell-lecture': [
    { id: 1, topic: "Astronomy", lectureTranscript: "The solar system consists of the sun and everything that orbits around it..." },
    { id: 2, topic: "Biology", lectureTranscript: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods..." },
    { id: 3, topic: "History", lectureTranscript: "The Renaissance was a fervent period of European cultural, artistic, political and economic rebirth..." },
    { id: 4, topic: "Commerce", lectureTranscript: "E-commerce has transformed the way businesses operate and interact with customers..." },
    { id: 5, topic: "Medicine", lectureTranscript: "Vaccines are a crucial tool in public health, helping to prevent the spread of infectious diseases..." }
  ],
  'answer-short-question': [
    { id: 1, question: "What do we call the person who writes plays?", expectedAnswer: "Playwright" },
    { id: 2, question: "What is the capital city of Australia?", expectedAnswer: "Canberra" },
    { id: 3, question: "How many sides does a triangle have?", expectedAnswer: "Three" },
    { id: 4, question: "What do you use to measure temperature?", expectedAnswer: "Thermometer" },
    { id: 5, question: "What is the opposite of 'expand'?", expectedAnswer: "Contract" }
  ]
};

export const pteWritingData = {
    'summarize-written-text': [
        { id: 1, text: "The industrial revolution was a period of significant social and economic change...", topic: "History" },
        { id: 2, text: "Artificial intelligence is transforming the way we work and live...", topic: "Technology" },
        { id: 3, text: "The importance of biodiversity cannot be overstated in maintaining ecosystem stability...", topic: "Biology" },
        { id: 4, text: "Modern architecture often prioritizes sustainability and energy efficiency...", topic: "Design" },
        { id: 5, text: "The psychological effects of social media on adolescents are a subject of ongoing research...", topic: "Society" }
    ],
    'write-essay': [
        { id: 1, prompt: "Should governments invest more in space exploration? Discuss your view.", topic: "Space" },
        { id: 2, prompt: "Is online learning as effective as traditional classroom education? Give reasons.", topic: "Education" },
        { id: 3, prompt: "The rise of automation in the workplace: benefits and drawbacks.", topic: "Work" },
        { id: 4, prompt: "Should city centers be completely car-free? Discuss the implications.", topic: "Urban Planning" },
        { id: 5, prompt: "The impact of globalization on local cultures and traditions.", topic: "Culture" }
    ]
};

export const pteReadingData = {
    'multiple-choice': [
        { id: 1, passage: "Reading Passage about global warming...", question: "What is the main cause mentioned?", options: ["Option A", "Option B", "Option C"], answer: "Option A" },
        { id: 2, passage: "Reading Passage about psychology...", question: "What does the author imply?", options: ["Option A", "Option B", "Option C"], answer: "Option B" },
        { id: 3, passage: "Reading Passage about space...", question: "Which fact is true?", options: ["Option A", "Option B", "Option C"], answer: "Option C" },
        { id: 4, passage: "Reading Passage about history...", question: "When did the event occur?", options: ["Option A", "Option B", "Option C"], answer: "Option A" },
        { id: 5, passage: "Reading Passage about robotics...", question: "What is the future trend?", options: ["Option A", "Option B", "Option C"], answer: "Option B" }
    ],
  'reorder-paragraphs': [
    { id: 1, paragraphs: ["Para A", "Para B", "Para C", "Para D"], correctOrder: [2, 0, 3, 1] },
    { id: 2, paragraphs: ["Para 1", "Para 2", "Para 3", "Para 4"], correctOrder: [1, 3, 0, 2] },
    { id: 3, paragraphs: ["Sentence 1", "Sentence 2", "Sentence 3"], correctOrder: [2, 1, 0] },
    { id: 4, paragraphs: ["A", "B", "C", "D"], correctOrder: [0, 1, 2, 3] },
    { id: 5, paragraphs: ["X", "Y", "Z"], correctOrder: [1, 0, 2] }
  ]
};

export const pteListeningData = {
    'summarize-spoken-text': [
        { id: 1, audioUrl: '/audio/pte/sst-1.mp3', transcript: "Lecture transcript 1...", topic: "Lecture 1" },
        { id: 2, audioUrl: '/audio/pte/sst-2.mp3', transcript: "Lecture transcript 2...", topic: "Lecture 2" },
        { id: 3, audioUrl: '/audio/pte/sst-3.mp3', transcript: "Lecture transcript 3...", topic: "Lecture 3" },
        { id: 4, audioUrl: '/audio/pte/sst-4.mp3', transcript: "Lecture transcript 4...", topic: "Lecture 4" },
        { id: 5, audioUrl: '/audio/pte/sst-5.mp3', transcript: "Lecture transcript 5...", topic: "Lecture 5" }
    ],
  'write-from-dictation': [
    { id: 1, sentence: "The library will be closed for renovations during the summer break." },
    { id: 2, sentence: "Please submit your assignments before the deadline on Friday." },
    { id: 3, sentence: "The professor will hold office hours every Monday afternoon." },
    { id: 4, sentence: "Innovation is key to maintaining a competitive edge in the industry." },
    { id: 5, sentence: "Students are encouraged to participate in extracurricular activities." }
  ]
};
