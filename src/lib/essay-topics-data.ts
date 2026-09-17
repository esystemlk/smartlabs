// Predicted + all essay topics for PTE 'Write Essay'. Extracted from the
// essay practice page so the same data can be seeded into Firestore
// (pte_questions) via the admin seed button, then read from the DB.

export interface Topic {
  id: number;
  text: string;
  category: string;
  no?: number; // sequential number shown for prediction topics
}

// Essay scoring types now live in src/types/essay.ts (AIResponse + sub-interfaces).

export const TOPICS: Topic[] = [
  { id: 1, text: "Some people believe that students learn better by watching other students. To what extent do you agree or disagree?", category: "Education" },
  { id: 2, text: "Many people around the world want to study in foreign universities. Do you think the advantages of studying abroad outweigh the disadvantages?", category: "Education" },
  { id: 3, text: "Some people think that students should focus on achieving good grades. Others, however, believe that education should be aimed at developing students' individual potential. Discuss both views and give your opinion.", category: "Education" },
  { id: 4, text: "Students should be encouraged to evaluate their own teachers. To what extent do you agree or disagree?", category: "Education" },
  { id: 5, text: "There is an increasing number of people in many countries who do not have a job. What are the reasons for this? What are the solutions?", category: "Economy" },
  { id: 6, text: "Some people think that the government should pay for health care, while others believe that it is the individual's responsibility. Discuss both views and give your opinion.", category: "Society" },
  { id: 7, text: "Some people say that we should live in the present and not worry about the future. To what extent do you agree or disagree?", category: "Society" },
  { id: 8, text: "Some people think that the best way to stay healthy is to follow a balanced diet. Others believe that regular exercise is more important. Discuss both views and give your opinion.", category: "Health" },
  { id: 9, text: "Some people believe that children should be taught how to be good members of society. Others think that children should be taught academic subjects. Discuss both views and give your opinion.", category: "Education" },
  { id: 10, text: "Some people believe that schools should focus on academic skills, while others think schools should focus on life skills. Discuss both views and give your opinion.", category: "Education" },
  { id: 11, text: "Some people think that digital communication is destroying face-to-face communication. To what extent do you agree or disagree?", category: "Technology" },
  { id: 12, text: "Some people think that the government should spend money on improving public transportation, while others believe the government should spend money on improving roads. Discuss both views and give your opinion.", category: "Travel" },
  { id: 13, text: "Many people believe that the internet is a blessing. However, some people think that it has more negative impacts than positive impacts. Discuss both views and give your own opinion.", category: "Technology" },
  { id: 14, text: "Some people think that parents should teach their children how to be independent. Others think that parents should teach their children to depend on others. Discuss both views and give your opinion.", category: "Education" },
  { id: 15, text: "Some people believe that machines will soon take over the work done by human beings. To what extent do you agree or disagree?", category: "Technology" },
  { id: 16, text: "Some people believe that friends are more important than family. To what extent do you agree or disagree?", category: "Society" },
  { id: 17, text: "Some people think that universities should only offer subjects that help students get jobs, while others believe all subjects should be available. Discuss both views and give your opinion.", category: "Education" },
  { id: 18, text: "Some people think that a sense of competition in children should be encouraged. Others believe that children who are taught to cooperate rather than compete become more useful adults. Discuss both views.", category: "Education" },
  { id: 19, text: "In many countries, a small number of people earn extremely high salaries. Some people believe that this is good for the country, while others think the government should control salaries. Discuss.", category: "Economy" },
  { id: 20, text: "Some people believe that it is best to accept a bad situation such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both views.", category: "Society" },
  { id: 21, text: "City life is more exciting than life in the country. To what extent do you agree or disagree?", category: "Society" },
  { id: 22, text: "Some people think that new homes should be built in the countryside, while others think people should be encouraged to live in cities. Discuss both views and give your opinion.", category: "Society" },
  { id: 23, text: "Some people think that the most important thing in a job is having a high income. To what extent do you agree or disagree?", category: "Economy" },
  { id: 24, text: "Some people believe that the government should tax fast food. To what extent do you disagree or agree?", category: "Society" },
  { id: 25, text: "Some people believe that climate change is caused by human activities. To what extent do you agree or disagree?", category: "Environment" },
  { id: 26, text: "Medical technology is responsible for increasing the average life expectancy. Do you think it is a curse or a blessing?", category: "Health" },
  { id: 27, text: "What are the advantages and problems of cheaper public transportation? Give your opinion from your own experience.", category: "Travel" },
  { id: 28, text: "For a less developed country, the disadvantages of tourism are as great as the advantages. Please discuss this statement, and explain your opinion.", category: "Travel" },
  { id: 29, text: "Some universities deduct marks from students' work if it is given late. What is your opinion? What other actions do you recommend?", category: "Education" },
  { id: 30, text: "Television serves many useful functions. To what extent do you agree with this? Explain why with your own experience.", category: "Media" },
  { id: 31, text: "Do you think experiential learning (i.e. learning by doing) can work well in high schools or colleges?", category: "Education" },
  { id: 32, text: "Many education systems assess students' learning using formal written examinations. To what extent do you agree or disagree?", category: "Education" },
  { id: 33, text: "Some believe the value of travel is highly overrated. 'One brilliant scholar never leaves the home base.' To what extent do you agree?", category: "Travel" },
  { id: 34, text: "Many countries spend large amounts of money on the restoration of historic buildings rather than on modern housing. To what extent do you agree or disagree with this analysis?", category: "Society" },
  { id: 35, text: "While artificial intelligence becomes so advanced, people can use computers to translate foreign languages. That makes learning a foreign language unnecessary. To what extent do you agree?", category: "Technology" },
  { id: 36, text: "Age restrictions are placed on many activities. Give an example, state which minimum age you think it should be and share your own experience.", category: "Society" },
  { id: 37, text: "Many people say there should be a maximum wage for high-paying jobs as some people are paid too much. Do you support that?", category: "Economy" },
  { id: 38, text: "Some people prefer to live in cities, while some people prefer to live in the countryside. Which is better for you? Give your reasons.", category: "Society" },
  { id: 39, text: "People who are famous entertainers or sportspeople should give up the right to privacy as this is the price of fame. To what extent do you agree or disagree?", category: "Media" },
  { id: 40, text: "The world's governments and international organizations confront a multitude of global problems. Which do you think is the most pressing problem for the inhabitants of our planet and give the solution?", category: "Global" },
  { id: 41, text: "In many countries unemployment among young people is a serious problem. One suggested solution is to shorten the working week. What do you think are the advantages and disadvantages? Do you think this policy should apply to just young workers or the whole workforce？", category: "Economy" }
];

// High-probability predicted exam questions (reworded collection). Shown first,
// under the "Predictions" tab; the older TOPICS list sits under "All Topics".
export const PREDICTIONS: Topic[] = [
  { id: 5001, no: 1, text: "As cities continue to expand, governments should prioritize developing stronger public transport networks accessible to everyone instead of constructing additional roads mainly for people who own vehicles. To what extent do you agree or disagree?", category: "Travel" },
  { id: 5002, no: 2, text: "Mass media, including television, radio and newspapers, significantly affects people, particularly younger generations. It plays an important role in forming people's views, especially those of teenagers and young adults. To what extent do you agree with this? Please provide examples.", category: "Media" },
  { id: 5003, no: 3, text: "Today, it is becoming increasingly challenging to maintain a healthy balance between work and other parts of one's life, such as spending leisure time with family members. How important do you think this balance is, and why do some people find it difficult to achieve?", category: "Society" },
  { id: 5004, no: 4, text: "Should parents be legally accountable for their children's behavior? Support your viewpoint using examples from your studies, observations or personal experiences.", category: "Society" },
  { id: 5005, no: 5, text: "Some universities reduce students' marks when assignments are submitted late. What is your view on this practice? What alternative measures would you suggest?", category: "Education" },
  { id: 5006, no: 6, text: "Advances in medical technology have contributed to a longer average life expectancy. Do you consider this development a blessing or a curse?", category: "Health" },
  { id: 5007, no: 7, text: "Governments around the world and international organizations face numerous global challenges. Which problem do you consider the most urgent for people on our planet, and what solution would you propose?", category: "Global" },
  { id: 5008, no: 8, text: "What are the advantages and difficulties for high school students who study plays and other theatrical works written hundreds of years ago? Discuss this using your own experience.", category: "Education" },
  { id: 5009, no: 9, text: "As more digital media becomes available online, some believe libraries are becoming unnecessary. Universities should invest in new digital resources instead of continually updating printed textbooks. Discuss the benefits and drawbacks of this view and give your own opinion.", category: "Education" },
  { id: 5010, no: 10, text: "Age limits apply to many activities. People are often expected to wait until an appropriate age before getting married, driving, voting, purchasing certain products, or taking part in particular activities. Choose one example, state what you think the minimum age should be, and share your own experience.", category: "Society" },
  { id: 5011, no: 11, text: "Successful study needs sufficient time, a comfortable environment and peace. Some argue that combining education with employment is unrealistic because work may interfere with learning. To what extent do you think these statements are realistic? Give your opinion with examples.", category: "Education" },
  { id: 5012, no: 12, text: "Which major issue should governments prioritize when allocating public funds: climate change, education, or public health? Explain your viewpoint and support it with examples.", category: "Global" },
  { id: 5013, no: 13, text: "When companies market consumer products such as food and clothing, should they focus more on building the company's reputation or on short-term approaches such as discounts and promotional offers? Explain why.", category: "Economy" },
  { id: 5014, no: 14, text: "Some people believe laws can influence and change human behavior, whereas others argue that legislation has very little impact. What is your opinion?", category: "Society" },
  { id: 5015, no: 15, text: "For developing countries, the negative effects of tourism may be just as significant as its benefits. Discuss this view and explain your own opinion.", category: "Travel" },
  { id: 5016, no: 16, text: "In today's technology-driven world, new inventions are being developed constantly. Describe a recent invention and explain whether you believe its effect on society is beneficial or harmful.", category: "Technology" },
  { id: 5017, no: 17, text: "Television performs several useful roles: it can help people unwind, provide opportunities to learn, and offer a sense of companionship to those who are lonely. To what extent do you agree with this view? Explain your answer using your own experience.", category: "Media" },
  { id: 5018, no: 18, text: "It is predicted that in the future people will spend fewer hours at work than they do today. To what extent do you agree with this prediction? Support your opinion with examples from your own experience.", category: "Economy" },
  { id: 5019, no: 19, text: "Youth unemployment is a major issue in many countries. One proposed solution is to reduce the length of the working week. What are the possible benefits and drawbacks of this approach? Should it apply only to younger employees or to workers of every age group?", category: "Economy" },
  { id: 5020, no: 20, text: "Many countries invest substantial amounts of money in preserving historic buildings instead of developing modern housing. To what extent do you agree or disagree with this approach? What are its main advantages and disadvantages? Support your answer with relevant experience or examples.", category: "Society" },
  { id: 5021, no: 21, text: "Growing up in the 21st century is more difficult for children than it was for previous generations. To what extent do you agree with this view? Explain your opinion.", category: "Society" },
  { id: 5022, no: 22, text: "Some people choose to live in urban areas, while others prefer the countryside. Which environment do you think is better for you? Give reasons and examples from your experience.", category: "Society" },
  { id: 5023, no: 23, text: "Some people argue that the importance of travel is greatly exaggerated, noting that a brilliant scholar may never leave their home base. To what extent do you agree that travelling is not essential for receiving a high-quality education?", category: "Travel" },
  { id: 5024, no: 24, text: "Climate change is a serious worldwide concern. Who should bear the greatest responsibility for addressing it: governments, major corporations, or individual citizens?", category: "Environment" },
  { id: 5025, no: 25, text: "Many education systems evaluate student learning through formal written examinations. Some believe these exams are an effective and valid assessment method. To what extent do you agree or disagree? Support your answer with examples from your own experience.", category: "Education" },
  { id: 5026, no: 26, text: "The information revolution created by modern mass communication has produced both beneficial and harmful effects for individuals and society. To what extent do you agree with this view? Explain your reasons using your own experience.", category: "Media" },
  { id: 5027, no: 27, text: "In many cities and towns, large shopping centres are taking the place of small local stores. Some people consider this a positive change. To what extent do you agree with this opinion?", category: "Economy" },
  { id: 5028, no: 28, text: "In some businesses, employers include employees in decisions concerning products and services. What are the main benefits and drawbacks of this management approach?", category: "Economy" },
  { id: 5029, no: 29, text: "Some people believe experiential learning, or learning through practical experience, can be effective in formal education, while others prefer traditional teaching methods. Do you think learning by doing can work successfully in high schools or colleges?", category: "Education" },
  { id: 5030, no: 30, text: "Do you believe the architectural design of buildings can have a positive or negative influence on the places where people choose to live and work?", category: "Society" },
  { id: 5031, no: 31, text: "Nowadays, many people spend so much time on their jobs that they have very limited time for their private and personal lives. How common is this issue, and what problems can this lack of personal time create?", category: "Society" },
  { id: 5032, no: 32, text: "Some people claim that experience is the most effective teacher because real-life experiences can teach more successfully than books or formal schooling. To what extent do you agree? Give reasons or examples from your personal experience.", category: "Education" },
  { id: 5033, no: 33, text: "Imagine you have been asked to conduct a study on climate change. Which specific aspect of climate change would you choose to investigate, and why? Support your answer with examples.", category: "Environment" },
  { id: 5034, no: 34, text: "Some argue that famous entertainers and athletes should sacrifice part of their right to privacy because this is a consequence of being well known. To what extent do you agree or disagree with this view? Support your opinion with relevant experiences.", category: "Media" },
  { id: 5035, no: 35, text: "Some people believe studying a foreign language at school should be mandatory. To what extent do you agree with this idea? Use examples or personal experience to support your viewpoint.", category: "Education" },
  { id: 5036, no: 36, text: "Many people argue that highly paid occupations should have a maximum salary because certain individuals earn excessively high incomes. Do you support this idea? Explain your viewpoint using reasons or your own experience.", category: "Economy" },
  { id: 5037, no: 37, text: "As artificial intelligence becomes increasingly sophisticated, computers can translate foreign languages more effectively. Some therefore believe learning another language is no longer necessary. To what extent do you agree with this view?", category: "Technology" },
  { id: 5038, no: 38, text: "Many people feel that their jobs leave insufficient time for their personal lives. How widespread do you think this problem is, and what measures could help address the difficulties caused by this lack of time?", category: "Society" },
  { id: 5039, no: 39, text: "It is sometimes argued that studying in another country is given too much importance because many successful scholars complete their education locally. To what extent do you agree with this view?", category: "Travel" },
];
