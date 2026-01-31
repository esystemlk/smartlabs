export interface DiscussionData {
  id: string;
  title: string;
  transcript: string;
}

export const pteSummarizeGroupDiscussionData: DiscussionData[] = [
  {
    id: 'sgd1',
    title: 'Flexible Working Arrangements',
    transcript: `Speaker A: I think offering flexible working hours is essential in today's world. It improves work-life balance and can even boost productivity.
Speaker B: I agree, but it can be challenging for team collaboration. If everyone has a different schedule, it's hard to organize meetings.
Speaker C: That's a valid point, but with tools like shared calendars and instant messaging, we can overcome that. The key is clear communication and setting core hours when everyone must be available.
Speaker A: Exactly. It's about trust and output, not just being present in the office from 9 to 5.`,
  },
  {
    id: 'sgd2',
    title: 'Reducing Plastic Waste',
    transcript: `Speaker A: We need to do more to reduce single-use plastic. Banning plastic bags in supermarkets was a good start.
Speaker B: Definitely. But what about plastic bottles? The amount of waste they generate is enormous. We should invest more in public water fountains.
Speaker C: I think the responsibility also lies with the manufacturers. They should be pushed to use more sustainable packaging materials. It shouldn't just be on the consumer to make changes.
Speaker B: That's true. A combination of government policy, corporate responsibility, and individual action is what's needed for real change.`,
  },
];
