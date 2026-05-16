import { createHash } from "crypto";

export function verifyPkceS256(
  codeVerifier: string,
  codeChallenge: string,
): boolean {
  if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
    return false;
  }
  const digest = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return digest === codeChallenge;
}
