export interface FillInBlanksData {
  id: string;
  passage: string; // Passage with placeholders like {1}, {2}
  blanks: {
    id: string; // e.g., '1'
    options: string[];
    correctAnswer: string;
  }[];
}

export const pteReadingFillInBlanksDropdownData: FillInBlanksData[] = [
  {
    id: 'fibd1',
    passage: 'Climate change is one of the most pressing issues of our time. The overwhelming scientific {1} is that human activities, particularly the burning of fossil fuels, are the main {2} of the recent warming trend. The {3} of rising temperatures include more extreme weather events, sea-level rise, and threats to biodiversity. {4} these challenges requires a global effort to transition to renewable energy sources.',
    blanks: [
      { id: '1', options: ['consensus', 'dispute', 'opinion', 'debate'], correctAnswer: 'consensus' },
      { id: '2', options: ['driver', 'effect', 'benefit', 'result'], correctAnswer: 'driver' },
      { id: '3', options: ['consequences', 'beginnings', 'causes', 'advantages'], correctAnswer: 'consequences' },
      { id: '4', options: ['Ignoring', 'Creating', 'Mitigating', 'Exacerbating'], correctAnswer: 'Mitigating' },
    ],
  },
  {
    id: "fibd_a1",
    passage: "Drive down any highway, and you'll see a proliferation of chain restaurants—most likely, if you travel long and far enough you'll see McDonald's golden arches as well as signs for Burger King, Hardee's, and Wendy's, the 'big four' of burgers. Despite its name, though, Burger King has fallen short of {1} the burger crown, unable to surpass market leader McDonald's No. 1 sales status. Always the bridesmaid and never the bride, Burger King remains No. 2. Worse yet, Burger King has experienced a six-year 22 percent decline in customer traffic, with its overall quality rating dropping while ratings for the other three {2} have increased. The decline has been {3} to inconsistent product quality and poor customer service. Although the chain tends to throw advertising dollars at the problem, an understanding of Integrated Marketing Communication theory would suggest that internal management problems (nineteen CEOs in fifty years) need to be {4} before a unified, long-term strategy can be put in place. The {5} of consistency in brand image and messages, at all levels of communication, has become a basic tenet of IMC theory and practice. The person who takes the customer's order must communicate the same message as Burger King's famous tagline, 'Have it your way,' or the customer will just buzz up the highway to a chain restaurant that seems more consistent and, therefore, more {6}.",
    blanks: [
      { id: "1", options: ["filling", "calming", "winning", "getting"], correctAnswer: "winning" },
      { id: "2", options: ["participations", "contenders", "cooperators", "contestants"], correctAnswer: "contenders" },
      { id: "3", options: ["dedicated", "contributed", "devoted", "attributed"], correctAnswer: "attributed" },
      { id: "4", options: ["rectified", "ratified", "realized", "recognized"], correctAnswer: "rectified" },
      { id: "5", options: ["importance", "pressure", "incumbency", "ignorance"], correctAnswer: "importance" },
      { id: "6", options: ["unavailable", "reliable", "quality", "disputable"], correctAnswer: "reliable" },
    ],
  },
  {
    id: "fibd_a2",
    passage: "The Edo-Tokyo Tatemono En is an open-air architectural museum, but could be better thought of as a park. Thirty buildings from the 19th and early 20th centuries from {1} around Tokyo were restored and relocated to the space, where they can be explored by future generations to come.The buildings are a collection of houses and businesses, shops, and bathhouses, all of which would have been present on a typical middle-class street from Edo-period to Showa-era Tokyo. The west section is {2}, with traditional thatched roof bungalows of the 19th century. Meiji-era houses are also on view, constructed in a more Western style after Japan opened its borders in 1868.The Musashino Sabo Cafe occupies the {3} floor of one such house, where visitors can enjoy a cup of tea. The east section is primarily businesses from the 1920s and 30s. Visitors are free {4} through a kitchenware shop, a florist's, an umbrella store, a bar, a soy sauce shop, a tailor's, a cosmetics shop, and an inn.",
    blanks: [
      { id: "1", options: ["across", "almost", "fully", "all"], correctAnswer: "all" },
      { id: "2", options: ["residential", "residing", "resident", "residence"], correctAnswer: "residential" },
      { id: "3", options: ["base", "dusty", "ground", "earthly"], correctAnswer: "ground" },
      { id: "4", options: ["wandering", "to wander", "wandered", "wander"], correctAnswer: "to wander" },
    ],
  },
  {
    id: "fibd_a3",
    passage: "If you see a movie, or a TV advertisement, that involves a fluid behaving in an unusual way, it was probably made using technology based on the work of a Monash researcher. Professor Joseph Monaghan, who pioneered an influential {1} for interpreting the behavior of liquids that underlies most special effects involving water, has been {2} with election to the Australian Academy of Sciences. Professor Monaghan was recognized for developing Smoothed Particle Hydrodynamics (SPH). His research started in 1977 when he tried to use computer {3} to describe the formation of stars and stellar systems. The algorithms available at the time were {4} of describing the complicated systems that evolve out of chaotic clouds of gas in the galaxy. Monaghan and Bob Gingold replaced the fluid or gas in the simulation with large numbers of particles with properties that {5} those of the fluid.",
    blanks: [
      { id: "1", options: ["method", "research", "pace", "deviation"], correctAnswer: "method" },
      { id: "2", options: ["informed", "voted", "nominated", "honored"], correctAnswer: "honored" },
      { id: "3", options: ["action", "simulation", "equation", "stimulation"], correctAnswer: "simulation" },
      { id: "4", options: ["impossible", "incapable", "fallible", "inapplicable"], correctAnswer: "incapable" },
      { id: "5", options: ["presented", "showed", "liked", "mimicked"], correctAnswer: "mimicked" },
    ],
  },
  {
    id: "fibd_a4",
    passage: "A herbal is a book of plants, describing their appearance, their properties and how they may be used for preparing ointments and medicines. The medical use of plants is {1} on fragments of papyrus and clay tablets from ancient Egypt, Samaria and China that date back 5,000 years. Around 65 BC, a Greek physician called Dioscorides wrote a herbal that was {2} into Latin and Arabic. An illustrated manuscript copy of the text made in Constantinople {3} from the sixth century. The first printed herbals date from the dawn of European printing in the 1480s. They provided valuable information for apothecaries, whose job was to make the pills and potions {4} by physicians.",
    blanks: [
      { id: "1", options: ["registered", "recorded", "memorized", "discovered"], correctAnswer: "recorded" },
      { id: "2", options: ["moved", "interpreted", "translated", "remote"], correctAnswer: "translated" },
      { id: "3", options: ["preserves", "revives", "suffers", "survives"], correctAnswer: "survives" },
      { id: "4", options: ["presided", "presented", "prescribed", "predominated"], correctAnswer: "prescribed" },
    ],
  },
  {
    id: "fibd_a5",
    passage: "You have about 30 minutes to answer each question. You must take account of how many marks are {1} when you answer it. Even if you think you can write more, don't spend 15 minutes {2} a low-value part. {3} a space at the end of your answer and come back to it if you have time. If you cannot think of an answer to some part, leave a space and move on to the next part. Don't write about something unrelated to the correct answer — this is just a waste of your {4} time (and the examiner's).",
    blanks: [
      { id: "1", options: ["marked", "needed", "taken", "available"], correctAnswer: "available" },
      { id: "2", options: ["scoring", "marking", "answering", "ignoring"], correctAnswer: "answering" },
      { id: "3", options: ["attend", "acquire", "leave", "focus"], correctAnswer: "leave" },
      { id: "4", options: ["valuable", "available", "useful", "beneficial"], correctAnswer: "valuable" },
    ],
  },
  {
    id: "fibd_a6",
    passage: "Opportunity cost incorporates the notion of scarcity: No matter what we do, there is always a trade-off. We must trade off one thing for another because resources are limited and can be used in different ways. {1}, we use up resources that could have been used to acquire something else. The {2} of opportunity cost allows us to measure this tradeoff. Most decisions {3} several alternatives. If you consider studying for history a {4} use of your time than working, then the opportunity cost of studying economics is the extra points you could have received on a history exam.",
    blanks: [
      { id: "1", options: ["with acquiring something", "without acquiring something", "By acquiring something", "having acquired something"], correctAnswer: "By acquiring something" },
      { id: "2", options: ["image", "use", "notion", "strategy"], correctAnswer: "notion" },
      { id: "3", options: ["involve", "involved", "have involved", "had involved"], correctAnswer: "involve" },
      { id: "4", options: ["better", "value", "best", "force"], correctAnswer: "better" },
    ],
  },
  {
    id: "fibd_a7",
    passage: "Formed two million years ago when low-density salt was pushed up through the much harder materials surrounding it, the Cardona Salt Mountain is one of the largest domes of its kind in the world. While small amounts of other minerals pervade the savory hill, the salt pile {1} a near translucent quality if not for the thin layer of reddish clay coating the exterior. The {2} of the mountain was recognized as early as the middle ages when Romans began exploiting the mountain for its salt, which began to bolster the young Cardonian {3}. In {4} to the mineral export, the locals of Cardona began making salt sculptures to sell.",
    blanks: [
      { id: "1", options: ["would have", "where", "has", "has had"], correctAnswer: "would have" },
      { id: "2", options: ["significant", "significance", "significantly", "signify"], correctAnswer: "significance" },
      { id: "3", options: ["economically", "economy", "economist"], correctAnswer: "economy" },
      { id: "4", options: ["contrast", "addition", "interest", "adaption"], correctAnswer: "addition" },
    ],
  },
  {
    id: "fibd_a8",
    passage: "DNA is a molecule that does two things. First, it acts as the {1} material, which is passed down from generation to generation. Second, it directs, to a considerable extent, the construction of our bodies, telling our cells what kinds of molecules to make and {2} our development from a single-celled zygote to a fully formed adult. These two things are of course {3}. The DNA sequences that construct the best bodies are more likely to get passed down to the next generation because well-constructed bodies are more likely to survive and {4} to reproduce.",
    blanks: [
      { id: "1", options: ["acquired", "familial", "molecular", "hereditary"], correctAnswer: "hereditary" },
      { id: "2", options: ["establishing", "guiding", "pushing", "determining"], correctAnswer: "guiding" },
      { id: "3", options: ["supplanted", "connected", "paralleled", "required"], correctAnswer: "connected" },
      { id: "4", options: ["thus", "yet", "namely", "nevertheless"], correctAnswer: "thus" },
    ],
  },
  {
    id: "fibd_a9",
    passage: "The best way to experience the museum is from the top floor down. At some hours, museum staff members are giving small hands-on {1} of techniques such as quillwork. These small surveys of the museum's vast holdings are called 'Windows on the Collection.' Appearing on every floor in the halls that {2} the rotunda, these display cases serve as a kind of visible storage. Their arrangements are artistic, and their contents perhaps {3} designed to jar the visitor. Older {4} of birds, mammals and sea creatures {5} alongside witty contemporary works. The distinction may be passé in the academic world, but still {6} strong among much of the general public.",
    blanks: [
      { id: "1", options: ["articles", "patterns", "specimens", "demonstrations"], correctAnswer: "demonstrations" },
      { id: "2", options: ["override", "overstate", "overturn", "overlook"], correctAnswer: "overlook" },
      { id: "3", options: ["intentionally", "inevitably", "inadvertently", "favorably"], correctAnswer: "intentionally" },
      { id: "4", options: ["status", "totems", "images", "sculptures"], correctAnswer: "sculptures" },
      { id: "5", options: ["present", "flourish", "appear", "scatter"], correctAnswer: "appear" },
      { id: "6", options: ["holds", "holes", "insist", "has"], correctAnswer: "holds" },
    ],
  },
  {
    id: "fibd_a10",
    passage: "Leadership is all about being granted permission by others to lead their thinking. Moral authority comes from many {1}, including being authentic and genuine, having integrity, and showing a real and deep understanding of the business in question. All these {2} build confidence. Leaders lose moral authority for three reasons: they behave {3}, they become plagued by self-doubt and lose their conviction, or they are blinded by power, lose self-awareness and thus lose {4} with those they lead. It is up to them to {5} by a moral code.",
    blanks: [
      { id: "1", options: ["foundations", "origins", "outcomes", "sources"], correctAnswer: "sources" },
      { id: "2", options: ["objects", "functions", "elements", "factors"], correctAnswer: "factors" },
      { id: "3", options: ["falsely", "arguably", "internally", "unethically"], correctAnswer: "unethically" },
      { id: "4", options: ["contempt", "association", "connection", "conviction"], correctAnswer: "connection" },
      { id: "5", options: ["abide", "remain", "stand", "confirm"], correctAnswer: "abide" },
    ],
  },
  {
    id: "fibd_a11",
    passage: "Literature is considered classic when it has stood the test of time and it stands the test of time when the artistic {1} it expresses continues to be relevant, no matter the period in which the work was {2}. Indeed, classic literature is considered as such {3} book sales or public popularity. That said, classic literature {4} merits lasting recognition. Not everything that is well-written or is {5} by technical achievement or critical acclaim will automatically be considered a classic. Conversely, works that have not been {6} or received positively by the writer's contemporaries or critics can still be considered as classics.",
    blanks: [
      { id: "1", options: ["quietly", "vacate", "bid", "claim"], correctAnswer: "claim" },
      { id: "2", options: ["written", "writing", "write", "to write"], correctAnswer: "written" },
      { id: "3", options: ["regardless of", "lacking of", "provided with", "according to"], correctAnswer: "regardless of" },
      { id: "4", options: ["exclusively", "usually", "merely", "consequentially"], correctAnswer: "usually" },
      { id: "5", options: ["formed", "categorized", "notified", "concluded"], correctAnswer: "categorized" },
      { id: "6", options: ["decide", "acknowledged", "transmitted", "revised"], correctAnswer: "acknowledged" },
    ],
  },
  {
    id: "fibd_a12",
    passage: "Dr Claire Matthews said demographic characteristics had a substantial impact on choices people made about KiwiSaver funds and retirement savings. {1} fund selection, she found significant differences based on gender. 'Males are risk takers, {2} it's in their choice of car or their investment fund.' Other demographic factors can also influence the choices {3} made about retirement savings. Those with bachelor and higher degrees and higher household incomes were more likely to choose aggressive and {4} funds. {5}, both the youngest and oldest age groups were more likely to be invested in {6} funds.",
    blanks: [
      { id: "1", options: ["apart from", "in spite of", "as far as", "When it came to"], correctAnswer: "When it came to" },
      { id: "2", options: ["either", "only", "unless", "whether"], correctAnswer: "whether" },
      { id: "3", options: ["being", "been", "have", "were"], correctAnswer: "being" },
      { id: "4", options: ["retrogressive", "steady", "challenging", "growth"], correctAnswer: "growth" },
      { id: "5", options: ["to be honest", "last but not least", "for example", "On the other hand"], correctAnswer: "On the other hand" },
      { id: "6", options: ["constructive", "compensative", "consecutive", "conservative"], correctAnswer: "conservative" },
    ],
  },
  {
    id: "fibd_a13",
    passage: "Children have sound sleep patterns. They can {1} sleep for 8-9 hours and get up at a fixed time. But teenagers don't. Their sleep patterns are {2} by their {3} schedules, in which they sometimes have more classes but sometimes have fewer. {4} these factors, they actually need longer sleep and {5} sleep may be responsible for their learning problems.",
    blanks: [
      { id: "1", options: ["soundly", "successfully", "hardly", "barely"], correctAnswer: "soundly" },
      { id: "2", options: ["affected", "influenced", "gained", "diverged"], correctAnswer: "affected" },
      { id: "3", options: ["expressive", "erratic", "explicitic", "erroneous"], correctAnswer: "erratic" },
      { id: "4", options: ["regardless", "despite", "as", "unless"], correctAnswer: "despite" },
      { id: "5", options: ["uneven", "insufficient", "unequal", "default"], correctAnswer: "insufficient" },
    ],
  },
  {
    id: "fibd_a14",
    passage: "What history books tell us about the past is not everything that happened, but what historians {1}. They cannot put in everything: choices have to be made. So, {2}, when a national school curriculum for England and Wales was first discussed at the end of the 1980s, the history curriculum was the subject of considerable public and media {3}. Margaret Thatcher {4} in the debate. There were two main camps: those who thought the history of Britain should take pride of {5}, and those who favored 'world history'.",
    blanks: [
      { id: "1", options: ["was selected", "have selected", "have been selected", "will be selected"], correctAnswer: "have selected" },
      { id: "2", options: ["nevertheless", "shall we say", "for example", "likewise"], correctAnswer: "for example" },
      { id: "3", options: ["realization", "knowledge", "interest", "test"], correctAnswer: "interest" },
      { id: "4", options: ["had intervened", "intervened", "was intervened", "did intervened"], correctAnswer: "intervened" },
      { id: "5", options: ["location", "place", "culture", "opportunity"], correctAnswer: "place" },
    ],
  },
  {
    id: "fibd_a15",
    passage: "Snails are not traditionally known for quick thinking, but new research shows they can make complex decisions using just two brain cells in {1} that could help engineers design more efficient robots. Scientists attached electrodes to freshwater snails {2} they searched for lettuce. They found that just one cell was used by the mollusc to tell {3} it was hungry or not, while another let it know when food was present. Foodsearching is an example of goal-directed behavior, {4} which an animal must integrate information about both its external environment and internal state while using as little energy as possible. Robots could use the {5} possible components necessary to perform complex tasks. What goes on in our brains when we {6} complex behavioral decisions is poorly understood. The study reveals how just two neurons {7} create a mechanism in an animal's brain.",
    blanks: [
      { id: "1", options: ["findings", "result", "recommendations", "decisions"], correctAnswer: "findings" },
      { id: "2", options: ["because", "although", "but", "as"], correctAnswer: "as" },
      { id: "3", options: ["that", "if", "neither", "how"], correctAnswer: "if" },
      { id: "4", options: ["true", "about", "during", "to"], correctAnswer: "during" },
      { id: "5", options: ["least", "less", "fewest", "few"], correctAnswer: "fewest" },
      { id: "6", options: ["take", "act", "make", "hold"], correctAnswer: "make" },
      { id: "7", options: ["shall", "should", "can", "may"], correctAnswer: "can" },
    ],
  },
  {
    id: "fibd_a16",
    passage: "The ribs form a cage that shelters {1} heart and lungs. Joints are where {2} bones meet. The {3} joints of the body — such as those found at the hip, shoulders, elbows, knees, wrists, and ankles — are freely movable. {4} kinds of freely movable joints play a big part in voluntary movement. Ball-and-socket joints allow the greatest freedom {5} movement.",
    blanks: [
      { id: "1", options: ["the", "that", "other"], correctAnswer: "the" },
      { id: "2", options: ["that", "which", "one", "two"], correctAnswer: "two" },
      { id: "3", options: ["whole", "entire", "individual", "main"], correctAnswer: "main" },
      { id: "4", options: ["all", "two", "one", "three"], correctAnswer: "three" },
      { id: "5", options: ["with", "to", "during", "of"], correctAnswer: "of" },
    ],
  },
  {
    id: "fibd_a17",
    passage: "Populations can change through three processes: fertility, mortality and migration. Fertility {1} the number of children that women have and differs from fecundity. Demographers most commonly study mortality using the Life Table, a statistical {2} which provides information about mortality conditions. Migration researchers do not designate movements as migrations, {3} they are somewhat permanent. Demographers who study migration typically do so through census data on place of {4}. Demography is widely taught in universities across the world, {5} students with initial training in social sciences, statistics or health studies.",
    blanks: [
      { id: "1", options: ["contributes", "rotates", "involves", "requires"], correctAnswer: "involves" },
      { id: "2", options: ["means", "study", "research", "device"], correctAnswer: "device" },
      { id: "3", options: ["but", "though", "unless", "therefore"], correctAnswer: "unless" },
      { id: "4", options: ["preference", "residence", "importance", "health"], correctAnswer: "residence" },
      { id: "5", options: ["researching", "attracting", "analyzing", "exploiting"], correctAnswer: "attracting" },
    ],
  },
  {
    id: "fibd_a18",
    passage: "The narrative of law and order is located fundamentally at the level of individual guilt and responsibility. Criminal acts are seen as individual issues of personal responsibility and {1}, to which the state responds by way of policing, {2}, adjudication and punishment. The problem is that so often analysis ends there, at the level of individual action, {3} in terms of responsibility, guilt, evil. To take but one {4}, it would be absurd to restrict analysis of obesity to individual greed.",
    blanks: [
      { id: "1", options: ["guilty", "capability", "culpability", "reliability"], correctAnswer: "culpability" },
      { id: "2", options: ["persecution", "prosecution", "execution", "inspection"], correctAnswer: "prosecution" },
      { id: "3", options: ["combined", "characterized", "chosen", "conclude"], correctAnswer: "characterized" },
      { id: "4", options: ["phenomenon", "legitimacy", "instance", "connection"], correctAnswer: "instance" },
    ],
  },
];
