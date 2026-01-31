
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
];
