export function normalizePhoneNumber(input: string | null | undefined): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }

  return trimmed;
}

export function phoneLookupValues(input: string | null | undefined): string[] {
  const trimmed = input?.trim();
  const normalized = normalizePhoneNumber(input);
  const digits = trimmed?.replace(/\D/g, "") ?? "";
  const values = new Set<string>();

  if (trimmed) values.add(trimmed);
  if (normalized) values.add(normalized);
  if (digits) values.add(digits);

  if (normalized?.startsWith("+1") && normalized.length === 12) {
    const national = normalized.slice(2);
    values.add(national);
    values.add(`${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}`);
    values.add(`(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`);
  }

  return Array.from(values);
}
