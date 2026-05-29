export function calcEndTime(
  startDate: string,
  startTime: string,
  durationMinutes: number,
): { date: string; time: string } | null {
  if (!startDate || !startTime || durationMinutes <= 0) return null;
  const end = new Date(new Date(`${startDate}T${startTime}`).getTime() + durationMinutes * 60_000);
  return {
    date: end.toISOString().slice(0, 10),
    time: end.toTimeString().slice(0, 5),
  };
}
