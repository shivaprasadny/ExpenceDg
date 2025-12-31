import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { initDb } from "../src/db/db";
import { hasPin, isLockEnabled } from "../src/security/lock";
import { isUnlockedThisSession } from "../src/security/session";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initDb();
  }, []);

  useEffect(() => {
    (async () => {
      const enabled = await isLockEnabled();
      const pinOk = await hasPin();

      const inAuth = segments[0] === "(auth)";

      // ✅ Only force unlock if NOT unlocked in this app session
      if (enabled && pinOk && !inAuth && !isUnlockedThisSession()) {
        router.replace({ pathname: "/unlock" }); // cleaner path
      }
    })();
  }, [segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
