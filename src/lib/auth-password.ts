export const MIN_PASSWORD_LENGTH = 6;

export function validatePasswordPair(
  password: string,
  confirmPassword: string,
): string | null {
  if (!password) {
    return "Password is required";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
}
