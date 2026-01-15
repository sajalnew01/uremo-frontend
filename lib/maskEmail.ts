/**
 * Masks an email address for privacy.
 * Example: "sajalnew01@gmail.com" → "saj***@gmail.com"
 */
export function maskEmail(email?: string | null): string {
  const e = String(email || "").trim();
  if (!e || !e.includes("@")) return "User";

  const [local, domain] = e.split("@");
  if (!local || !domain) return "User";

  // Show first 3 chars of local part, mask rest
  const visible = local.slice(0, 3);
  const masked = `${visible}***@${domain}`;
  return masked;
}

/**
 * Returns a display name: masked email or fallback.
 */
export function getDisplayName(
  user?: { email?: string; name?: string; _id?: string; id?: string } | null
): string {
  if (!user) return "User";

  if (user.name) return user.name;
  if (user.email) return maskEmail(user.email);

  const id = user._id || user.id;
  if (id) return `User #${String(id).slice(-6)}`;

  return "User";
}
