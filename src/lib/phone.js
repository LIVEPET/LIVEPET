export const onlyDigits = (value) => String(value ?? "").replace(/\D/g, "");

// Máscara brasileira: (11) 99999-9999 (celular) ou (11) 9999-9999 (fixo).
export const formatPhone = (value) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Válido: DDD + 8 dígitos (fixo) ou DDD + 9 dígitos começando com 9 (celular).
export const isValidPhone = (value) => {
  const digits = onlyDigits(value);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (!/^[1-9][1-9]/.test(digits)) return false; // nenhum DDD tem zero
  if (digits.length === 11 && digits[2] !== "9") return false;
  return true;
};