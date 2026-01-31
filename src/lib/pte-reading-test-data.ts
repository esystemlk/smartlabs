export interface ReadingQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface ReadingTest {
  passage: string;
  questions: ReadingQuestion[];
}

export const pteReadingTestData: ReadingTest = {
  passage: `The concept of 'smart cities' is a topic of increasing interest. A smart city uses information and communication technology (ICT) to improve operational efficiency, share information with the public, and provide a better quality of government service and citizen welfare. The main goal is to optimize city functions and promote economic growth while also improving the quality of life for citizens by using smart technology.

Smart city applications are developed to manage urban flows and allow for real-time responses. A smart city, therefore, is a city that is equipped with basic infrastructure to give a decent quality of life, a clean and sustainable environment through application of some smart solutions. It includes smart components such as smart grid, smart homes, intelligent transportation systems, and smart healthcare.

However, the implementation of smart cities faces several challenges. These include concerns over data privacy and security, the high cost of implementation, and the need for a robust and reliable digital infrastructure. Furthermore, there is a risk of creating a 'digital divide' where citizens without access to or knowledge of technology are left behind. Successfully navigating these challenges is crucial for the future development of smart urban environments.`,
  questions: [
    {
      id: 'q1',
      questionText: 'What is the primary objective of a smart city?',
      options: [
        'To exclusively use renewable energy.',
        'To optimize city functions and improve citizens\' quality of life.',
        'To reduce the city\'s population.',
        'To increase public transportation costs.',
      ],
      correctAnswer: 'To optimize city functions and improve citizens\' quality of life.',
    },
    {
      id: 'q2',
      questionText: 'Which of the following is NOT listed as a component of a smart city?',
      options: [
        'Intelligent transportation systems',
        'Smart grid',
        'Public parks and recreational areas',
        'Smart homes',
      ],
      correctAnswer: 'Public parks and recreational areas',
    },
    {
      id: 'q3',
      questionText: 'What does the passage identify as a major challenge for smart cities?',
      options: [
        'Lack of interest from citizens.',
        'The technology becoming outdated too quickly.',
        'Concerns over data privacy and the high cost of implementation.',
        'Too much reliance on human management.',
      ],
      correctAnswer: 'Concerns over data privacy and the high cost of implementation.',
    },
    {
      id: 'q4',
      questionText: 'What is meant by the \'digital divide\' in the context of smart cities?',
      options: [
        'A gap between different technology companies.',
        'The separation between digital and physical infrastructure.',
        'A conflict between urban and rural areas.',
        'Inequality between citizens who have access to technology and those who do not.',
      ],
      correctAnswer: 'Inequality between citizens who have access to technology and those who do not.',
    },
    {
      id: 'q5',
      questionText: 'According to the passage, smart city applications are designed to:',
      options: [
        'Manage urban flows and allow for real-time responses.',
        'Collect data for historical analysis only.',
        'Replace all human decision-making.',
        'Operate only during business hours.',
      ],
      correctAnswer: 'Manage urban flows and allow for real-time responses.',
    },
  ],
};
