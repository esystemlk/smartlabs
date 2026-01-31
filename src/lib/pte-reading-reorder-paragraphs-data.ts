export interface ReorderParagraphsData {
  id: string;
  title: string;
  paragraphs: string[]; // Correct order
}

export const pteReadingReorderParagraphsData: ReorderParagraphsData[] = [
  {
    id: 'rp1',
    title: 'The History of Tea',
    paragraphs: [
      'The story of tea begins in China. According to legend, in 2737 BC, the Chinese emperor Shen Nung was sitting beneath a tree while his servant boiled drinking water, when some leaves from the tree blew into the water.',
      'Shen Nung, a renowned herbalist, decided to try the infusion that his servant had accidentally created. The tree was a Camellia sinensis, and the resulting drink was what we now call tea.',
      'Tea consumption spread throughout Chinese culture and society, from the royal court to the common people. It was prized for its flavor and its medicinal properties.',
      'It wasn\'t until the 17th century that tea was introduced to Europe by Dutch and Portuguese merchants, where it quickly became a popular beverage among the aristocracy.',
    ],
  },
  {
    id: 'rp2',
    title: 'The Process of Photosynthesis',
    paragraphs: [
      'Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy.',
      'The process starts when chlorophyll, the green pigment in plants, absorbs light energy from the sun.',
      'This energy is then used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds like glucose.',
      'Oxygen is released as a byproduct, which is crucial for most life on Earth, while the glucose provides the plant with the energy it needs to grow.',
    ],
  },
];
