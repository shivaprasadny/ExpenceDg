let unlockedThisSession = false;

export function isUnlockedThisSession() {
  return unlockedThisSession;
}

export function setUnlockedThisSession(value: boolean) {
  unlockedThisSession = value;
}
