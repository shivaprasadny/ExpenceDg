import * as Crypto from "expo-crypto";

export function normalizeAnswer(s: string) {
  return s.trim().toLowerCase();
}

export function makeSalt() {
  // simple salt; good enough for offline app
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export async function hashPin(pin: string, salt: string) {
  // Never store raw PIN. Store SHA-256(pin + salt)
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${pin}:${salt}`
  );
}
