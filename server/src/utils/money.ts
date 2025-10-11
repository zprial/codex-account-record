export function toCents(amount: number) {
  if (!Number.isFinite(amount)) {
    throw new Error('金额必须是有限数字');
  }

  return Math.round(amount * 100);
}

export function centsToString(cents: number) {
  const isNegative = cents < 0;
  const absolute = Math.abs(cents);
  const integerPart = Math.trunc(absolute / 100);
  const fractionalPart = absolute % 100;
  const result = `${integerPart}.${fractionalPart.toString().padStart(2, '0')}`;
  return isNegative ? `-${result}` : result;
}
