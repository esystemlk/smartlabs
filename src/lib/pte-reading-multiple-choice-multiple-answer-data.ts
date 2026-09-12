
export interface MCMATestData {
  id: string;
  passage: string;
  question: string;
  options: string[];
  correctAnswers: string[];
}

export const pteReadingMultipleChoiceMultipleAnswerData: MCMATestData[] = [
  {
    id: 'mcma1',
    passage: 'The honeybee is a fascinating social insect. A colony of honeybees is a highly organized society with a strict division of labor. The queen bee is the only female that reproduces, laying thousands of eggs. Worker bees, which are all female, perform various tasks such as foraging for nectar and pollen, building the honeycomb, and defending the hive. Drones, the male bees, have the sole purpose of mating with a new queen. Bees communicate through a series of complex dances, the most famous being the "waggle dance," which informs other bees about the direction and distance of a food source.',
    question: 'According to the passage, which of the following are true about a honeybee colony?',
    options: [
      'All female bees can reproduce.',
      'Worker bees are responsible for finding food.',
      'Drones help defend the hive.',
      'Bees use dances to communicate information.',
      'The queen bee helps build the honeycomb.',
    ],
    correctAnswers: [
      'Worker bees are responsible for finding food.',
      'Bees use dances to communicate information.',
    ],
  },
  {
    id: "mcma_b1",
    passage: "Analysis of ancient DNA from one of the best-preserved Neolithic tombs in Britain revealed that most people buried there came from five continuous generations of a single extended family. DNA from 35 individuals at Hazleton North showed that 27 were close biological relatives. The study provides new insights into kinship and burial practices.",
    question: "What has been revealed by analysis of ancient DNA from one of Britain's best-preserved Neolithic tombs?",
    options: [
      "The results provide new insights into neolithic art.",
      "More than half of them were close relatives.",
      "Agriculture hadn't been invented when the group were living.",
      "All of the people buried in the neolithic tombs are descended from five generations of one extended family.",
      "It reveals the details of the organization of the prehistoric family.",
    ],
    correctAnswers: [
      "More than half of them were close relatives.",
      "It reveals the details of the organization of the prehistoric family.",
    ],
  },
  {
    id: "mcma_b2",
    passage: "By the laws of probability, most decisions made under pressure should be flawed ones, yet psychologists have found that people routinely make correct judgments most of the time, even with limited information. We can learn how to make better snap judgments, and the brain evolved to make us think on our feet.",
    question: "Which of the following does the passage tell us about decision making?",
    options: [
      "The brain is designed to enable quick decision making.",
      "Quick decision making can be improved.",
      "Quick decision making routinely leads to error.",
      "To make correct decisions we require all relevant information.",
      "Thinking things through thoroughly will lead to greater success.",
    ],
    correctAnswers: [
      "The brain is designed to enable quick decision making.",
      "Quick decision making can be improved.",
    ],
  },
  {
    id: "mcma_b3",
    passage: "The more television children watch, the more advertising they see, the more likely they are to ask for products, and the more conflict can be generated with parents. A University of Arizona-led study explored how children's TV habits may contribute to parents' overall stress.",
    question: "What can we infer from the passage?",
    options: [
      "When watching one television ad, children purchase one thing from it.",
      "Children will ask for more things when they watch more ads, which can lead to more conflict.",
      "Children's habit of watching TV has definitely no impact on parents' stress level.",
      "Putting children in front of TV tends to make parents happy.",
      "Parents can reduce their stress by limiting their children in watching TV.",
    ],
    correctAnswers: [
      "Children will ask for more things when they watch more ads, which can lead to more conflict.",
      "Parents can reduce their stress by limiting their children in watching TV.",
    ],
  },
  {
    id: "mcma_b4",
    passage: "What you eat influences your taste for what you might want to eat next. Fruit-fly experiments compared balanced, sugar-reduced/protein-enriched, and sugar-enriched/protein-depleted diets with the same total calorie content. Diet affects dopamine and insulin signaling in the brain and the flies' peripheral sensory response.",
    question: "Which statements about the study are true?",
    options: [
      "What you eat has little to do with what you want to eat next.",
      "An unbalanced intake of macronutrients is essential.",
      "The fly senses macronutrients through its taste system.",
      "Researchers made sure total calories in all three diets were the same.",
      "Researchers tested the flies every two days for a week.",
      "Dopamine in the brain is closely related to diet.",
    ],
    correctAnswers: [
      "The fly senses macronutrients through its taste system.",
      "Researchers made sure total calories in all three diets were the same.",
      "Dopamine in the brain is closely related to diet.",
    ],
  },
  {
    id: "mcma_b5",
    passage: "A protein named Agrin has been discovered to promote wound healing and repair when triggered after skin tissue is injured. Loss of extracellular matrix can delay wound healing. Physical injury enhanced Agrin expression, which helps preserve the mechanical architecture of injured skin layers.",
    question: "Which statements are incorrect?",
    options: [
      "Agrin can heal the wound instantly.",
      "Loss of ECM can delay wound healing.",
      "Agrin expression was enhanced when skin tissue was physically damaged.",
      "Chronic wound healing complications were the main reason for decline of patients' emotional health.",
      "One in 20 Singaporeans suffers from diabetes or burns.",
    ],
    correctAnswers: [
      "Agrin can heal the wound instantly.",
      "Chronic wound healing complications were the main reason for decline of patients' emotional health.",
      "One in 20 Singaporeans suffers from diabetes or burns.",
    ],
  },
  {
    id: "mcma_b6",
    passage: "Computer- and smartphone-based treatments appear effective in reducing symptoms of depression, although it remains unclear whether they are as effective as face-to-face psychotherapy. Digital interventions differ from teletherapy; teletherapy uses videoconferencing or telephone services for one-on-one psychotherapy.",
    question: "Which statements are true?",
    options: [
      "Digital interventions require patients to log into software without interaction.",
      "Teletherapy is not identical with digital interventions.",
      "Computer- and smartphone-based therapy can be just as effective as face-to-face psychotherapy.",
      "Videoconferencing can be a viable method in teletherapy to promote one-on-one psychotherapy.",
      "Digital treatments are the only solution to COVID-19 mental health needs.",
    ],
    correctAnswers: [
      "Teletherapy is not identical with digital interventions.",
      "Videoconferencing can be a viable method in teletherapy to promote one-on-one psychotherapy.",
    ],
  },
  {
    id: "mcma_b7",
    passage: "A study of 185 children aged 5–14 found that children are more likely to forgive someone who apologizes, more likely to forgive people who are 'in group', and more likely to forgive as their Theory of Mind skills become more advanced.",
    question: "What did the study find?",
    options: [
      "Children are more likely to forgive those who are 'in the group'.",
      "Forgiveness can help restore relationships and reduce future conflict.",
      "Children are more likely to forgive the person who apologizes.",
      "Children can forgive just like adults.",
      "The more advanced the theory of mind skills, the less likely a child is to forgive.",
    ],
    correctAnswers: [
      "Children are more likely to forgive those who are 'in the group'.",
      "Children are more likely to forgive the person who apologizes.",
    ],
  },
  {
    id: "mcma_b8",
    passage: "Research argues that using human-rights law may offer stronger prospects for protecting the Amazon. Safeguarding the rainforest is a critical priority, made more urgent by increases in deforestation and fires. International protection is complicated by territorial jurisdiction and sovereignty.",
    question: "According to the passage, which statements about Amazon protection are true?",
    options: [
      "The best way is to use human-rights laws and probably international legislation.",
      "Protecting the rainforest is a vital top priority.",
      "Using human-rights law is more likely to prove promising.",
      "Increased deforestation and fires have made protection more urgent.",
      "Protecting the Amazon is a common challenge of international law.",
    ],
    correctAnswers: [
      "Protecting the rainforest is a vital top priority.",
      "Using human-rights law is more likely to prove promising.",
      "Increased deforestation and fires have made protection more urgent.",
    ],
  },
  {
    id: "mcma_b9",
    passage: "New traffic-light technology is designed to absorb kinetic energy in collisions, remain undamaged and operational, save pedestrian and motorists' lives, satisfy regulatory standards, and make roads safer.",
    question: "What are the functions of traffic lights that absorb kinetic energy?",
    options: [
      "Increase collision damage.",
      "Save the lives of pedestrians and drivers.",
      "Meet regulatory standards.",
      "Maintain normal operation.",
      "Make our roads safer.",
    ],
    correctAnswers: [
      "Save the lives of pedestrians and drivers.",
      "Meet regulatory standards.",
      "Maintain normal operation.",
      "Make our roads safer.",
    ],
  },
  {
    id: "mcma_b10",
    passage: "ANU research warns that unless conservation is urgently increased, the regent honeyeater could be extinct within 20 years. It was once common, but more than 90% of preferred woodland habitat has been lost and fewer than 300 birds remain.",
    question: "Which statements about the regent honeyeater are correct?",
    options: [
      "It has gone extinct.",
      "It will be extinct within 20 years.",
      "It used to be one of the most common species.",
      "It decreased because it was difficult to study in the wild.",
      "Habitat decrease is the main reason for its decline.",
    ],
    correctAnswers: [
      "It will be extinct within 20 years.",
      "It used to be one of the most common species.",
      "Habitat decrease is the main reason for its decline.",
    ],
  },
  {
    id: "mcma_b11",
    passage: "A year-long University of Cambridge study found that teaching children in ways that encourage empathy measurably improves creativity. Creativity was assessed with the Torrance Test of Creative Thinking, while design-thinking tools were used to solve real-world problems.",
    question: "Which statements are false?",
    options: [
      "Significant improvement of empathy promotes overall creativity score.",
      "Torrance Test of Creative Thinking can assess creativity.",
      "The study lasted two years.",
      "Torrance Test of Creative Thinking can solve real-world problems.",
      "Encouraging children to empathize can improve creativity.",
    ],
    correctAnswers: [
      "The study lasted two years.",
      "Torrance Test of Creative Thinking can solve real-world problems.",
    ],
  },
  {
    id: "mcma_b12",
    passage: "Research suggests an mRNA vaccine stimulating production of TR1 could help strengthen skin defenses against skin cancer. Most skin cancer cases are linked to UV exposure. Melanin production is the body's way of trying to protect skin from burning. Melanoma is the most lethal type of skin cancer.",
    question: "Which statements are incorrect?",
    options: [
      "The body tries to protect skin from burning by producing melanin.",
      "Most cases of skin cancer are linked to ultraviolet radiation.",
      "The vaccine could help people boost defenses against skin cancer.",
      "Melanoma is the least deadly form of skin cancer.",
      "Ultraviolet radiation from the sun certainly causes skin cancer.",
    ],
    correctAnswers: [
      "Melanoma is the least deadly form of skin cancer.",
      "Ultraviolet radiation from the sun certainly causes skin cancer.",
    ],
  },
  {
    id: "mcma_b13",
    passage: "Climate-change-driven reductions in precipitation and river discharge are expected to diminish Amazon hydropower capacity. Hydrologic shifts by midcentury will reduce generation in many places. Solar and wind will become increasingly important. New facilities should be sited where flows are more reliable.",
    question: "Which statements are correct?",
    options: [
      "Hydrologic changes will reduce hydropower generation in many places by midcentury.",
      "New facilities should be sited where flow is less reliable.",
      "Hydroelectric reservoirs in Brazil are at record lows due to extreme drought.",
      "Hydropower is the only source of energy in the Amazon.",
      "Solar and wind will become increasingly important.",
    ],
    correctAnswers: [
      "Hydrologic changes will reduce hydropower generation in many places by midcentury.",
      "Hydroelectric reservoirs in Brazil are at record lows due to extreme drought.",
      "Solar and wind will become increasingly important.",
    ],
  },
  {
    id: "mcma_b14",
    passage: "A review of fourteen studies with 460,195 participants found an association between persistent low back pain and persistent chronic headaches. People experiencing one were typically twice as likely to experience the other. Just over one in 100 people in the UK are estimated to have both.",
    question: "What are the main findings of the study?",
    options: [
      "In the UK, about one in 100 people have both persistent back pain and persistent headaches.",
      "There is a link between persistent back pain and persistent headache.",
      "Headaches are the only cause of disability.",
      "People with persistent back pain or headaches are half as likely to develop either condition.",
      "The relationship is not quantifiable.",
    ],
    correctAnswers: [
      "In the UK, about one in 100 people have both persistent back pain and persistent headaches.",
      "There is a link between persistent back pain and persistent headache.",
    ],
  },
  {
    id: "mcma_b15",
    passage: "Aging and some drugs can weaken bones. In young bone there are more glucocorticoid receptors than mineralocorticoid receptors. Drugs blocking the mineralocorticoid receptor may help protect bone cells. Reducing the impact of glucocorticoid receptors initially seemed a logical way to protect bone.",
    question: "Which statements are true?",
    options: [
      "Glucocorticoids work badly for arthritis.",
      "Aging can weaken our bones.",
      "When young, there are fewer mineralocorticoid receptors than glucocorticoid receptors.",
      "Reducing glucocorticoid receptor effect must be a reasonable way to protect bone.",
      "Bone cells may be protected by drugs that block receptors.",
    ],
    correctAnswers: [
      "Aging can weaken our bones.",
      "When young, there are fewer mineralocorticoid receptors than glucocorticoid receptors.",
      "Bone cells may be protected by drugs that block receptors.",
    ],
  },
  {
    id: "mcma_b16",
    passage: "X-ray crystallography studies crystal structures through X-ray diffraction. X-rays are scattered in a manner characterized by the atomic structure of the lattice. Modern crystallography can determine structures of organic, inorganic, organometallic and biological compounds.",
    question: "Which factors are consistent with the theory of X-ray crystallography?",
    options: [
      "X-ray crystallization causes a reduction in interatomic distances of wavelengths.",
      "X-rays are scattered according to the atomic structure of the crystal lattice.",
      "Chemical compounds could only be analyzed after computer technology.",
      "The process can determine the chemical structure of biological compounds.",
      "X-rays will not diffract in crystalline substances.",
    ],
    correctAnswers: [
      "X-rays are scattered according to the atomic structure of the crystal lattice.",
      "The process can determine the chemical structure of biological compounds.",
    ],
  },
  {
    id: "mcma_b17",
    passage: "Britain continued using the Julian calendar after continental Europe adopted Gregorian reform. The Julian calendar's small annual error accumulated over centuries. Pope Gregory XIII ordered a 10-day advancement in 1582 and changed the leap-year rule.",
    question: "What factors were involved in the disparity between the calendars of Britain and Europe in the 17th century?",
    options: [
      "Provisions of the British Calendar Act of 1751.",
      "Britain's continued use of the Julian calendar.",
      "Accrual of very minor differences between Britain's calendar and real solar events.",
      "Failure to include years divisible by four as leap years.",
      "Decree of Pope Gregory XIII.",
      "Revolutionary ideas from the West Indies.",
      "Britain's use of twelve months rather than eleven.",
    ],
    correctAnswers: [
      "Britain's continued use of the Julian calendar.",
      "Accrual of very minor differences between Britain's calendar and real solar events.",
      "Decree of Pope Gregory XIII.",
    ],
  },
  {
    id: "mcma_b18",
    passage: "Ancient cave dwellings in Andalucia are being refurbished into modern residences. The passage uses several words referring to homes, including abodes, dwellings and habitations.",
    question: "Which words in the passage have the same meaning as 'residences'?",
    options: [
      "Abodes",
      "Amenities",
      "Connections",
      "Dwellings",
      "Habitations",
      "Hillsides",
      "Terrain",
    ],
    correctAnswers: [
      "Abodes",
      "Dwellings",
      "Habitations",
    ],
  },
  {
    id: "mcma_b19",
    passage: "Researchers modeled avalanches with steel beads and calculated a 'space factor' measuring disorder around each bead. Greater disorder meant an avalanche was more likely. Changes in the space factor allowed prediction of extra-large avalanches with 64% accuracy. Researchers argue that internal-disorder analysis may also improve earthquake forecasting.",
    question: "What can we learn from the 'space factor'?",
    options: [
      "It is related to space around each bead, and greater disorder indicates higher avalanche probability.",
      "Greater disorder makes an avalanche less likely.",
      "Internal disorder analysis will lead to a more successful model.",
      "It allowed 100% accurate prediction.",
      "Forecasting earthquakes is easier than predicting avalanches.",
    ],
    correctAnswers: [
      "It is related to space around each bead, and greater disorder indicates higher avalanche probability.",
      "Internal disorder analysis will lead to a more successful model.",
    ],
  },
];
