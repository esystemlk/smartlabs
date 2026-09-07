/**
 * The built-in PTE "predicted" essay topics — the single source shared by the
 * website essay trainer (ai-essay-practice) and the mobile app's question
 * endpoint, so both show exactly the same topics (alongside admin-added ones).
 */
export interface EssayTopic {
  id: number;
  text: string;
  category: string;
}

export const pteEssayTopics: EssayTopic[] = [
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
  { id: 41, text: "In many countries unemployment among young people is a serious problem. One suggested solution is to shorten the working week. What do you think are the advantages and disadvantages? Do you think this policy should apply to just young workers or the whole workforce？", category: "Economy" },
];
