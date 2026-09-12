export interface ReadingMCSAData {
  id: string;
  passage: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const pteReadingMultipleChoiceSingleAnswerData: ReadingMCSAData[] = [
  {
    id: "mcsa_e1",
    passage: "Your teenage daughter gets top marks in school, captains the debate team, and volunteers at a shelter for homeless people. But while driving the family car, her text-messages her best friend and rear-ends another vehicle. How can teens be so clever, accomplished, and responsible and reckless at the same time? Easily, according to two physicians at Children's Hospital Boston and Harvard Medical School (HMS) who have been exploring the unique structure and chemistry of the adolescent brain. The teenage brain is not just an adult brain with fewer miles on it, says Frances E. Jensen, a professor of neurology. It's a paradoxical time of development. These are people with very sharp brains, but they're not quite sure what to do with them. In animals, the movement is coordinated by a cluster of neurons in the spinal cord called the central pattern generator (CPG). This produces signals that drive muscles to contract rhythmically in a way that produces running or walking, depending on the pattern of pulses. A simple signal from the brain instructs the CPG to switch between different modes, such as going from a standstill to walking.",
    question: "According to the text, what is the reason teens can be so clever, accomplished and responsible and reckless at the same time in terms of brain activities?",
    options: [
      "Their brains are the same as adults' but with fewer miles on it.",
      "Their brains are so small that they cannot deal with so much information.",
      "They do not know what to do with their very sharp brains.",
      "Controlling their actions, CPG receives a simple signal from the brain to switch between different modes.",
    ],
    correctAnswer: "They do not know what to do with their very sharp brains.",
  },
  {
    id: "mcsa_e2",
    passage: "Social scientists use particular methods to gather qualitative evidence, from observation to interview, but they also use autobiographical accounts, journalism, and other documentary material to flesh out and add meaning to statistics. As with reading numbers, reading textual evidence requires us to practice, to set time aside to learn how to do it, and to understand the conventions of writing which operate in the different forms of writing we encounter. One of the main problems with reading textual evidence, though, is that, unlike the relationship most of us have with numbers where we may use them at a pretty basic level, most of us are, if anything, over-familiar with words. When we want to understand their value as social science evidence we need to forget how familiar we are with first person accounts and everyday speech - for example, in newspapers, magazines, and books - and learn a different approach to them. Social scientists use observation, interviews and even print journalism as evidence for the claims they make. They may collect evidence through questionnaires with pre-set questions and by open-ended interviews which allow respondents to speak for themselves. They may observe social relations explicitly as social scientists or may participate themselves in a particular community to gain 'inside' information. Social scientists also draw on print journalism on occasion and may use the same sources, for example official statistics, and the work of other social scientists to support their claims. We need to remember, though, that journalists do not need to present the same rigorous referencing and support for their claims as social scientists are required to do. Most importantly, newspaper and magazine articles are written under commercial pressures; for example they must help to sell the newspaper by being deliberately provocative, or by reflecting the dominant views of its readers.",
    question: "According to this passage, what do social scientists use written sources to do?",
    options: [
      "Formulating questionnaires and interview questions.",
      "Advising them on how to collect qualitative evidence.",
      "Adding information to other data they have collected.",
      "Change their understanding of numbers.",
    ],
    correctAnswer: "Adding information to other data they have collected.",
  },
  {
    id: "mcsa_e3",
    passage: "Four Earth-years ago, NASA's Curiosity rover successfully touched ground on Mars' dusty surface, after surviving a nail-biting descent through the red planet's thin atmosphere. Since its triumphant arrival, the car-size \"laboratory on wheels\" has travelled more than 13.5 kilometers, taking pictures, collecting samples, and analyzing rocks along the way. Recent software upgrades even let Curiosity autonomously choose which rocks it examines—and shoots with laser beams. Curiosity has spent more than 1,421 sols, or Martian days, exploring Gale Crater, a low-lying region that may have held past life, if it existed. While the rover has yet to confirm whether Mars once hosted living things, it has found evidence of an ancient freshwater lake in the sediments of Yellowknife Bay, the lowest point of the crater, offering tantalizing insight into the planet's past habitability. Since September 2014, Curiosity has been examining Mount Sharp, a mountain of layered rocks towering more than five kilometres high in the middle of Gale Crater.",
    question: "Choose the correct sentence that best summarizes the text.",
    options: [
      "Over the last four years, NASA's rover, Curiosity, has collected samples and taken photographs of Mars' surface which have revealed evidence of water but has not confirmed evidence of life.",
      "NASA's rover, Curiosity, has not had recent software upgrades that have let it explore new areas of Mars looking for evidence of life.",
      "Photographs of Mars' surface have not revealed evidence of water but have confirmed evidence of life.",
      "NASA's rover, Curiosity, has had recent software upgrades that have let it explore new areas of Mars looking for evidence of life.",
    ],
    correctAnswer: "Over the last four years, NASA's rover, Curiosity, has collected samples and taken photographs of Mars' surface which have revealed evidence of water but has not confirmed evidence of life.",
  },
  {
    id: "mcsa_e4",
    passage: "B-15 broke off from the Ross Ice Shelf in Antarctica. It was the largest iceberg ever documented, with a surface area of more than 4,200 square miles — more than twice the size of the state of Delaware. After it started breaking up, the largest of its pieces, B-15a, drifted along the coast of Antarctica, lingered on a shallow seamount, and collided with an ice tongue, before running aground and breaking again. Late in 2007, the largest remaining chunk floated out into the South Pacific where, in the warmer water, it began to disintegrate. For the whole of the next year, the ocean was noisier than usual. All the way up past the equator, 4,350 miles or so away from where B-15a broke apart, hydrophones that scientists from the National Oceanic and Atmospheric Administration (NOAA) had suspended underwater were picking up strange signals. Another set of hydrophones, this one in the Juan Fernández Islands, off the coast of Chile, picked up the noise, too, even louder. When the scientists used the two sets of data to determine the source of the noise, they found the most likely culprits: B-15a and C-19a, another giant iceberg. Twenty years ago, not so long before B-15 broke off from Antarctica, \"we didn't even know that icebergs made noise,\" says Haru Matsumoto, an ocean engineer at NOAA who has studied these sounds. But in the past few years, scientists have started to learn to distinguish the eerie, haunting sounds of iceberg life — ice cracking, icebergs grinding against each other, an iceberg grounding on the seafloor — and measure the extent to which those sounds contribute to the noise of the ocean. While they're just now learning to listen, the sounds of ice could help them understand the behavior and breakup of icebergs and ice shelves as the poles warm up.",
    question: "Where did the largest piece off from B-15 eventually go?",
    options: [
      "Seafloor",
      "Antarctica",
      "Chile",
      "South Pacific",
    ],
    correctAnswer: "South Pacific",
  },
  {
    id: "mcsa_e5",
    passage: "Social distancing, also called physical distancing, refers to staying a specific distance away from other people to help prevent illnesses from spreading. The specific distance is determined by health experts and national governments, and social distancing is a recommended medical practice to help \"flatten the curve,\" or lower the number of COVID-19 cases throughout the world. With all the misinformation online, take a few minutes to review how to understand social distance and learn why it's so important to help stop COVID-19. If you need help explaining social distancing to children, you can use the information below to help make social distancing easier for kids to understand.",
    question: "The passage is an excerpt from a longer essay. According to the last sentence, what may the remaining part of the essay be about?",
    options: [
      "More detailed professional information on the mechanisms of social distancing.",
      "A more simplified and interesting description about social distancing.",
      "Experimental evidence about the effectiveness of social distancing.",
      "The latest news about COVID-19 cases worldwide.",
    ],
    correctAnswer: "A more simplified and interesting description about social distancing.",
  },
  {
    id: "mcsa_e6",
    passage: "In organized crime there is a hierarchy, with higher-ranking members making decisions that trickle down to the other members of the family. The Mafia is not a single group or gang — it is made up of many families that have, at times, fought each other in bitter, bloody gang wars. At other times, they have cooperated in the interest of greater profits, sometimes even serving on a \"Commission\" that made major decisions affecting all the families. Most of the time, though, they simply agree to stay out of each other's way.",
    question: "From the author's description of Mafia, which of the following statement is true?",
    options: [
      "The Mafia is just a single gang that is divided into several different families.",
      "Families may fight with each other or work together depending on the circumstances.",
      "Organized crime is believed to be related to the Mafia.",
      "When there is a fight between two families, a \"Commission\" will decide how to settle it.",
    ],
    correctAnswer: "Families may fight with each other or work together depending on the circumstances.",
  },
  {
    id: "mcsa_e7",
    passage: "If you've decided you want to improve your fitness, walking is a good choice. It's free, simple, and adaptable to your schedule. If you've been relatively sedentary, you might find that you can't walk very far at first without getting sore or out-of-breath. You just have to keep at it! If you try to walk a little further every day, you'll find that your walking stamina gradually improves. If you don't have the patience for that, there are a few other tricks you can try to help you reach your goals faster.",
    question: "According to the passage, what might the \"tricks\" mentioned in the last sentence refer to?",
    options: [
      "methods to improve your stamina quickly.",
      "suggestions on how to keep fit.",
      "benefits of different styles of walking.",
      "different ways to build up your stamina over a long period.",
    ],
    correctAnswer: "methods to improve your stamina quickly.",
  },
  {
    id: "mcsa_e8",
    passage: "Many people think that being healthy is a difficult task that involves lots of dieting and time at the gym, but that's not actually true! By supporting your body and mind, making some simple tweaks to your routine, and setting small goals for yourself, you can be on the path toward living a healthier, happier life. Start a daily habit of making healthier choices when it comes to eating, relaxing, being active, and sleeping. Soon, you'll start to see your healthy life taking shape!",
    question: "The main purpose of the author is to ___",
    options: [
      "demonstrate how difficult it is to be healthy.",
      "show the disadvantages of changing lifestyles.",
      "encourage people to live a healthy lifestyle.",
      "argue how easy it is to live a different lifestyle.",
    ],
    correctAnswer: "encourage people to live a healthy lifestyle.",
  },
  {
    id: "mcsa_e9",
    passage: "Over a period of five years, James H. Clark, the internet pioneer whose Netscape browser once commanded that market, spent roughly $35 million to purchase dozens of Cambodian and Southeast Asian antiquities. After investigators convinced him these collections were all stolen and that he had been duped by a shady antiquities dealer, Mr. Clark said, \"My doing might inspire other people to do the same, but I'm not sure — it's hard for people to give up something they paid for, but for me, why would you want to own something that was stolen?\"",
    question: "We can infer from this passage that ___",
    options: [
      "Mr. Clark will not collect antiquities any more.",
      "Mr. Clark donates these collections to charity.",
      "Mr. Clark stole these antiquities in Asia.",
      "Mr. Clark will give these antiquities to the police.",
      "Mr. Clark will be under arrest.",
    ],
    correctAnswer: "Mr. Clark will not collect antiquities any more.",
  },
  {
    id: "mcsa_e10",
    passage: "Ever wondered about changing your life for the better? Maybe you're interested in losing weight, being more active or just feeling healthier. To live a healthier life you'll most likely need to make some adjustments in a wide variety of areas. Being \"healthy\" is based on many things including: your genetics, diet, exercise routine and lifestyle choices. Since you cannot control your genes, making changes to items you have control over can help lead to a healthier lifestyle. Focus on making small changes to your diet, exercise and other lifestyle factors to help make you healthier.",
    question: "What is the main idea of the text?",
    options: [
      "A healthier life requires various small changes to diverse aspects of our life, such as diet, exercise and so on.",
      "Healthier lifestyles can bring people a great deal of benefits, including losing weight, being more active and feeling healthier.",
      "Some delicate adjustments in a limited scope of areas are believed to help us to lead a healthier lifestyle.",
      "Apart from making small changes to our life, controlling our genes can also make us healthier.",
    ],
    correctAnswer: "A healthier life requires various small changes to diverse aspects of our life, such as diet, exercise and so on.",
  },
  {
    id: "mcsa_e11",
    passage: "Japan recently unveiled the world's first Dual-Mode Vehicle (DMV), a contraption that runs both on roads, like a bus, and on rails, like a train. The mini-bus-like contraption didn't win anyone over with its looks, but it definitely made an impression in terms of practicality. It runs with normal rubber tires on the road, but when it needs to switch to train mode, a pair of metal wheels drop down from the vehicle's underbelly. The front tires are lifted off the track, while the rear wheels stay down to propel the vehicle. Switching between road and train modes takes only about 15 seconds.",
    question: "According to this passage, we can know that ___",
    options: [
      "People think DMV is pragmatic.",
      "People like DMV's appearance.",
      "DMV can work as a plane.",
      "DMV needs 15 seconds to start the engine.",
    ],
    correctAnswer: "People think DMV is pragmatic.",
  },
  {
    id: "mcsa_e12",
    passage: "Located in the waters of Homestead, Florida, Tree of Life is a serene villa complex designed to alleviate visitors from stress and anxiety. Iranian architect Milad Eshtiyaghi visualized the project as six independent villas connected by footpaths. Both the walkways and the buildings float gently on the existing pond and immerse guests in nature. To fit with the peaceful atmosphere of the surroundings, the villas are designed with organic forms, lacking harsh edges with the exception of their angled roofs. These organic buildings in Tree of Life were inspired by the vegetation in the surrounding landscape. So the complex could \"become one\" with nature in Homestead.",
    question: "According to this passage, which one below is false?",
    options: [
      "Tree of Life is an ideal place for stressful people.",
      "All the buildings in this villa complex have harsh edges.",
      "There are trees around the villa complex.",
      "You will feel calm in the Tree of Life.",
    ],
    correctAnswer: "All the buildings in this villa complex have harsh edges.",
  },
  {
    id: "mcsa_e13",
    passage: "Scientists at Johns Hopkins Medicine meticulously counted brain cells in fruit flies and three species of mosquitos, revealing a number that would surprise many people outside the science world. The insects' tiny brains, on average, have about 200,000 neurons and other cells, they say. By comparison, a human brain has 86 billion neurons, and a rodent brain contains about 12 billion. Even though these brains are simple (in contrast to mammalian brains), they can do a lot of processing, even more than a supercomputer. They enable the insects to navigate, find food and perform other complicated tasks at the same time.",
    question: "According to this passage, we can know that fruit flies ___",
    options: [
      "have about 12 billion neurons and cells in the brain.",
      "have more brain cells than rodents.",
      "can do more processing than a supercomputer.",
      "can't navigate and find food at the same time.",
    ],
    correctAnswer: "can do more processing than a supercomputer.",
  },
  {
    id: "mcsa_e14",
    passage: "They rise out of the desert sands, monumental monoliths shaped over millennia by the winds of time. Man has left his mark here too, carving out more than 110 rock tombs, many with ornate details: steps symbolising the way to heaven above the entrance, shelf cornicing and perhaps the head of Medusa to warn against tomb raiders. The result is seriously stunning, the huge red rocks standing stark against the brilliant blue of the desert sky. This is Hegra, the site of an ancient Saudi Arabian city built by the Nabataeans. And I believe you'll be amazed and surprised by what you see when you come. Welcome!",
    question: "Where does this passage most likely to appear?",
    options: [
      "A textbook.",
      "A dictionary",
      "A travel book.",
      "An encyclopedia.",
    ],
    correctAnswer: "A travel book.",
  },
  {
    id: "mcsa_e15",
    passage: "California government has signed budget legislation that includes $45 million in one-time support for a statewide Animal Shelter Assistance Program. It will be administered by the Koret Shelter, at the University of California, Davis, Center for Companion Animal Health. The funding reflects the governor's commitment to providing resources that can help communities realize the state's long-held policy that \"no adoptable or treatable animal should be euthanized.\" The Shelter set up a grant process, create and distribute educational materials and perform in-person consultations to help achieve the goals of the policy. And the administer of it believed that the program has the potential to change the situation for vulnerable animals.",
    question: "According to the passage, Animal Shelter Assistance Program ___ .",
    options: [
      "hasn't been signed yet",
      "provides $45 billion for animals",
      "supports that treatable animals should not be euthanized",
      "is useless for improving the status of stray animals",
    ],
    correctAnswer: "supports that treatable animals should not be euthanized",
  },
  {
    id: "mcsa_e16",
    passage: "It's well established that sudden loud noises, such as fireworks or thunderstorms, commonly trigger a dog's anxiety, a new study finds even common noises, such as a vacuum or microwave, can be a trigger. The research found that high-frequency, intermittent noises such as the battery warning of a smoke detector are more likely to cause a dog anxiety, rather than low-frequency, continuous noise. Because dogs have a wider range of hearing, some noises could also be potentially painful to a dog's ears, such as very loud or high-frequency sounds. We can change batteries more frequently in smoke detectors or remove a dog from a room where loud noises might occur.",
    question: "According to the study, noises ___ .",
    options: [
      "make dogs happier",
      "with high-frequency and intermittence make dogs uneasier",
      "with low-frequency and continuousness make dogs more anxious",
      "will not be heard by dogs",
    ],
    correctAnswer: "with high-frequency and intermittence make dogs uneasier",
  },
  {
    id: "mcsa_e17",
    passage: "The word \"ferment\" comes from the Latin word for boiling or rising, which you'll understand if you've ever seen beer brewing or bread dough rising — both signs of fermentation in action. A biologist would probably say fermentation is the anaerobic production of energy, meaning that microorganisms that don't need oxygen to accomplish metabolization to fuel their bodies transform nutrients into energy in the absence of oxygen. This is true for some fermented foods — for instance, sauerkraut and alcohol are both products of the hard work of anaerobic bacteria. However, other foods and beverages that we consider \"ferments\" are made by aerobic microorganisms that use oxygen to do their business: kombucha, vinegars and miso are a few.",
    question: "The purpose of the text is to ___ .",
    options: [
      "explain the origins and meanings of the word \"ferment\".",
      "demonstrate two different types of fermentation.",
      "introduce two kinds of microorganisms responsible for fermentation.",
      "encourage people to protect microorganisms.",
    ],
    correctAnswer: "demonstrate two different types of fermentation.",
  },
  {
    id: "mcsa_e18",
    passage: "California grape growers in coastal areas can use less water during times of drought and cut irrigation levels without affecting crop yields or quality, according to a new study out of the University of California, Davis. Researchers focused on crop evapotranspiration, which was the amount of water lost to the atmosphere from the vineyard system based on canopy size. The weekly tests used irrigation to replace 25%, 50% and 100% of what had been lost by the crop to evapotranspiration. And they found that vineyards can use 50% of the irrigation water normally used by grape crops without compromising flavor, color and sugar content.",
    question: "How much irrigation water is the most beneficial in maintaining the grape's flavor profile and yield according to the research?",
    options: [
      "25%",
      "30%",
      "50%",
      "100%",
    ],
    correctAnswer: "50%",
  },
  {
    id: "mcsa_e19",
    passage: "New study from researchers at the University of California, Davis, finds that pesticides not only directly affect bee health, but effects from past exposure can carry over to future generations. The research suggests that female bees that were exposed to the insecticide as larvae had 20% fewer offspring than bees not exposed. Because the impacts of insecticides tend to be additive across life stages, repeated exposure has profound implications for population growth. The research showed that bees exposed to pesticides in both the first and second year resulted in a 72% lower population growth rate compared to bees not exposed at all.",
    question: "From the study, pesticides ___",
    options: [
      "indirectly have an influence on bees.",
      "reduce bees' fertility rates.",
      "promote population growth of bees.",
      "have lower and lower effect if bees repeatedly expose to them.",
    ],
    correctAnswer: "reduce bees' fertility rates.",
  },
  {
    id: "mcsa_e20",
    passage: "If you want to take advantage of public WiFi hot spots or your own home-based network, the first thing you'll need to do is make sure your computer has the right gear. Most new laptops and many new desktop computers come with built-in wireless transmitters. If your computer isn't already equipped, you can buy a wireless adapter that plugs into the PC card slot or USB port. Desktop computers can use USB adapters, or you can buy an adapter that plugs into the PCI slot inside the computer's case. Once you've installed a wireless adapter and the drivers that allow it to operate, your computer should be able to automatically discover existing networks. If you have an older computer, you may need to use a software program to detect and connect to a wireless network.",
    question: "When your PC cannot connect to a wireless network, which of the following cannot help you to address the problem?",
    options: [
      "To check whether there are WiFi hot spots available around.",
      "To check whether your computer has a wireless transmitter.",
      "To uninstall the wireless adapter on your computer.",
      "To install a wireless adapter on your PC.",
    ],
    correctAnswer: "To uninstall the wireless adapter on your computer.",
  },
];
