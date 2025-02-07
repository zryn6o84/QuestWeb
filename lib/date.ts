/**
 * 将各种日期格式转换为 ISO 字符串
 */
export const formatToISOString = (date: Date | string | null | undefined): string => {
  if (!date) return new Date().toISOString();
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

/**
 * 将各种日期格式转换为 Date 对象
 */
export const toDate = (date: Date | string | number | null | undefined): Date => {
  if (!date) return new Date();

  try {
    if (date instanceof Date) return date;
    if (typeof date === 'number') return new Date(date);
    return new Date(date);
  } catch (e) {
    console.error('Invalid date format:', e);
    return new Date();
  }
};

/**
 * Convert various date formats to ISO string
 */
export const toISOString = (date: Date | string | number | null | undefined): string => {
  return toDate(date).toISOString();
};