export function requireCheckInQrSecret(
  env: Record<string, string | undefined> = process.env,
): string {
  const secret = env.CHECK_IN_QR_SECRET;
  if (!secret) {
    throw new Error("CHECK_IN_QR_SECRET is required for QR check-ins.");
  }
  return secret;
}
