function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

export function validateCpf(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }
  let dv1 = (sum * 10) % 11;
  if (dv1 === 10) dv1 = 0;
  if (dv1 !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }
  let dv2 = (sum * 10) % 11;
  if (dv2 === 10) dv2 = 0;

  return dv2 === Number(digits[10]);
}

export function validateCnpj(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits[i]) * weights1[i];
  }
  let mod = sum % 11;
  const dv1 = mod < 2 ? 0 : 11 - mod;
  if (dv1 !== Number(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += Number(digits[i]) * weights2[i];
  }
  mod = sum % 11;
  const dv2 = mod < 2 ? 0 : 11 - mod;

  return dv2 === Number(digits[13]);
}
