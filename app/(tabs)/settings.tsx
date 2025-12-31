import { useCallback, useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { clearLockAll, isLockEnabled, setLockEnabled } from "../../src/security/lock";
import { setUnlockedThisSession } from "../../src/security/session";

export default function Settings() {
  const router = useRouter();
  const [enabled, setEnabledState] = useState(false);

  const refresh = useCallback(async () => {
    const v = await isLockEnabled();
    setEnabledState(v);
  }, []);

  // Refresh whenever Settings tab is focused (professional way)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onToggle = async (value: boolean) => {
    if (value) {
      // go setup; setup screen will enable after successful save
      router.push({ pathname: "/(auth)/setup-pin" });
      return;
    }

    Alert.alert("Disable App Lock?", "You can enable it again anytime from Settings.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disable",
        style: "destructive",
        onPress: async () => {
         await setLockEnabled(false);
await clearLockAll();
setUnlockedThisSession(true);
await refresh();

        },
      },
    ]);
  };

  const onChangePin = async () => {
    const lockOn = await isLockEnabled();
    if (!lockOn) {
      Alert.alert("App Lock is OFF", "Turn on App Lock first to set/change PIN.");
      return;
    }
    router.push({ pathname: "/(auth)/change-pin" });
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>Settings</Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 16 }}>Enable App Lock</Text>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>

      <Text style={{ color: "#666" }}>
        If enabled, you must unlock with PIN. Forgot PIN recovery uses 2 security questions.
      </Text>

      <Pressable
        onPress={onChangePin}
        style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#ddd" }}
      >
       <Text style={{ fontWeight: "800" }}>Change PIN & Questions</Text>

      </Pressable>
    </View>
  );
}
