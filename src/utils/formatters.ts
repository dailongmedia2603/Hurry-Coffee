export const formatDisplayPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  if (phone.startsWith('+84')) {
    return `0${phone.substring(3)}`;
  }
  if (phone.startsWith('84')) {
    return `0${phone.substring(2)}`;
  }
  return phone;
};