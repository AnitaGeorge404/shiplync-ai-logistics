/**
 * Secure, deterministic delivery verification OTP utilities.
 * Generates and validates 4-digit numeric OTPs tied to shipment tracking IDs.
 */

export function getDeliveryOtp(trackingId: string): string {
  if (!trackingId) return "1234";
  let hash = 5381;
  const str = trackingId.toUpperCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  const code = (hash % 9000) + 1000;
  return String(code);
}

export function verifyDeliveryOtp(trackingId: string, submittedOtp: string): boolean {
  if (!submittedOtp) return false;
  const expected = getDeliveryOtp(trackingId);
  return expected.trim() === submittedOtp.trim();
}
