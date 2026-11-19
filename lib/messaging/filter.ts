/**
 * Anti-disintermediation filter (Security by Design & Business Logic Integrity):
 * Redacts direct off-platform communication channels (phone numbers, social handles,
 * emails, off-platform payment rails) until escrow is funded.
 */
const PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, label: "[email redacted]" },
  { re: /\+?251[97]\d{8}/gi, label: "[phone redacted]" },
  { re: /\b09\d{8}\b/g, label: "[phone redacted]" },
  { re: /\b07\d{8}\b/g, label: "[phone redacted]" },
  { re: /@[a-zA-Z0-9_]{3,}/g, label: "[handle redacted]" },
  { re: /\b(?:telegram|t\.me|whatsapp|wa\.me|payoneer|paypal|binance)\b/gi, label: "[channel redacted]" },
  { re: /\b(?:telebirr|cbe\s*birr|awash\s*birr)\s*[:=]?\s*\d+/gi, label: "[payment redacted]" },
];

export function redactContactInfo(body: string): { text: string; redacted: boolean } {
  let text = body;
  let redacted = false;
  for (const { re, label } of PATTERNS) {
    const next = text.replace(re, () => {
      redacted = true;
      return label;
    });
    text = next;
  }
  return { text, redacted };
}

export function shouldApplyRedaction(escrowStatus: string): boolean {
  return escrowStatus === "awaiting_deposit";
}
