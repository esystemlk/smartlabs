export interface ReadAloudItem {
  id: string;
  text: string;
}

/** Seed Read Aloud passages (35–60 words each, exam-style). */
export const pteReadAloudData: ReadAloudItem[] = [
  { id: 'ra1', text: 'The invention of the printing press revolutionised the spread of knowledge, making books affordable and widely available. Before this, texts were copied by hand, a slow and costly process that limited literacy to a privileged few.' },
  { id: 'ra2', text: 'Coral reefs are among the most diverse ecosystems on the planet, supporting thousands of marine species. Rising ocean temperatures, however, cause coral bleaching, threatening the delicate balance that these underwater communities depend upon for survival.' },
  { id: 'ra3', text: 'Renewable energy sources such as solar and wind power are becoming increasingly cost-effective. As technology improves and production scales up, many countries are investing heavily in these alternatives to reduce their dependence on fossil fuels.' },
  { id: 'ra4', text: 'Regular physical exercise offers substantial benefits for both the body and the mind. Studies consistently show that moderate activity improves cardiovascular health, strengthens muscles, and can significantly reduce symptoms of stress and anxiety.' },
  { id: 'ra5', text: 'The migration of birds is one of nature’s most remarkable phenomena. Guided by instinct and environmental cues, some species travel thousands of kilometres each year, navigating with astonishing precision between their breeding and wintering grounds.' },
  { id: 'ra6', text: 'Artificial intelligence is transforming industries ranging from healthcare to transportation. While these technologies promise greater efficiency and new discoveries, they also raise important questions about privacy, employment, and the ethical use of data.' },
  { id: 'ra7', text: 'Volcanic eruptions, though destructive, play a crucial role in shaping the Earth’s surface. Over millions of years, the minerals released enrich surrounding soils, creating some of the most fertile agricultural regions found anywhere in the world.' },
  { id: 'ra8', text: 'Effective time management is an essential skill for university students. By prioritising tasks, setting realistic goals, and avoiding procrastination, learners can reduce stress and achieve a healthier balance between their studies and personal lives.' },
];
