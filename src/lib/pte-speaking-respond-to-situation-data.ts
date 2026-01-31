export interface SituationData {
  id: string;
  title: string;
  situation: string;
}

export const pteRespondToSituationData: SituationData[] = [
  {
    id: 'rts1',
    title: 'Late for a Meeting',
    situation: 'You are late for a meeting with your manager. You enter the room, and your manager says, "You’re late." What do you say?',
  },
  {
    id: 'rts2',
    title: 'Friend Forgets Your Birthday',
    situation: 'Your close friend forgot your birthday. They call you the next day and realize their mistake. What do you say to them?',
  },
  {
    id: 'rts3',
    title: 'Incorrect Coffee Order',
    situation: 'You ordered a black coffee, but the barista gave you a latte with sugar. The cafe is very busy. What do you say to the barista?',
  },
];
