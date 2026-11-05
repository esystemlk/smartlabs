/** Consecutive-day streak from a list of activities with a `timestamp`. */
export function calculateStudyStreak(activities: { timestamp: Date | string }[]) {
  if (!activities || activities.length === 0) return 0;
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  let streak = 0;
  let lastDate: Date | null = null;
  for (const activity of sorted) {
    const cur = new Date(activity.timestamp);
    cur.setHours(0, 0, 0, 0);
    if (!lastDate) {
      streak = 1;
    } else {
      const diff = Math.ceil(Math.abs(cur.getTime() - lastDate.getTime()) / 86400000);
      if (diff === 1) streak++;
      else if (diff > 1) break;
    }
    lastDate = cur;
  }
  return streak;
}
