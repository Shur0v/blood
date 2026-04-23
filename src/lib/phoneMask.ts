export function maskPhoneTail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 3) return "...";

  let seenDigits = 0;
  const totalDigits = digits.length;

  const kept = phone.replace(/\d/g, (digit) => {
    seenDigits += 1;
    if (seenDigits > totalDigits - 3) {
      return "";
    }
    return digit;
  });

  return `${kept.replace(/[^\d]+$/, "")}...`;
}
