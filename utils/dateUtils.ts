const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function format(date: Date, formatStr: string): string {
  const d = new Date(date);
  const map: Record<string, () => string | number> = {
    'yyyy': () => d.getFullYear(),
    'MMMM': () => MONTH_NAMES[d.getMonth()],
    'MMM': () => MONTH_NAMES_SHORT[d.getMonth()],
    'MM': () => String(d.getMonth() + 1).padStart(2, '0'),
    'M': () => d.getMonth() + 1,
    'dd': () => String(d.getDate()).padStart(2, '0'),
    'd': () => d.getDate(),
    'EEEE': () => DAY_NAMES[d.getDay()],
    'EEE': () => DAY_NAMES_SHORT[d.getDay()],
  };

  let result = formatStr;
  // Sort keys by length descending to match longer patterns first (e.g., MMMM before MMM before MM)
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  keys.forEach(key => {
    result = result.replace(new RegExp(key, 'g'), String(map[key]()));
  });
  
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}