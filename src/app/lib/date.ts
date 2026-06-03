export function parseLocalDate(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart ? timePart.split(":").map(Number) : [0, 0];
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}
