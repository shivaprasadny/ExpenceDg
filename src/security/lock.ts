import * as SecureStore from "expo-secure-store";

export type SecurityQA = { q: string; a: string }; // a = normalized answer
export type SecurityPack = { questions: SecurityQA[] };

const K = {
  enabled: "lock_enabled",
  pinHash: "pin_hash",
  pinSalt: "pin_salt",
  secqData: "secq_data",
};

export const LOCK_KEYS = K;

export async function isLockEnabled() {
  return (await SecureStore.getItemAsync(K.enabled)) === "1";
}

export async function setLockEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(K.enabled, enabled ? "1" : "0");
}

export async function setPinHashAndSalt(pinHash: string, pinSalt: string) {
  await SecureStore.setItemAsync(K.pinHash, pinHash);
  await SecureStore.setItemAsync(K.pinSalt, pinSalt);
}

export async function getPinHashAndSalt() {
  const pinHash = await SecureStore.getItemAsync(K.pinHash);
  const pinSalt = await SecureStore.getItemAsync(K.pinSalt);
  return { pinHash, pinSalt };
}

export async function hasPin() {
  const { pinHash, pinSalt } = await getPinHashAndSalt();
  return !!pinHash && !!pinSalt;
}

export async function saveSecurityPack(pack: SecurityPack) {
  await SecureStore.setItemAsync(K.secqData, JSON.stringify(pack));
}

export async function loadSecurityPack(): Promise<SecurityPack | null> {
  const raw = await SecureStore.getItemAsync(K.secqData);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearLockAll() {
  await SecureStore.deleteItemAsync(K.enabled);
  await SecureStore.deleteItemAsync(K.pinHash);
  await SecureStore.deleteItemAsync(K.pinSalt);
  await SecureStore.deleteItemAsync(K.secqData);
}
