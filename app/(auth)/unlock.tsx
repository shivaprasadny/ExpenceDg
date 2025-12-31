import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { getPinHashAndSalt, loadSecurityPack, setPinHashAndSalt } from "../../src/security/lock";
import { hashPin, makeSalt, normalizeAnswer } from "../../src/security/hash";
import { setUnlockedThisSession } from "../../src/security/session";

type QA = { q: string; a: string };

function pickTwoRandom(list: QA[]): QA[] {
  if (list.length <= 2) return list;
  const a = Math.floor(Math.random() * list.length);
  let b = Math.floor(Math.random() * list.length);
  while (b === a) b = Math.floor(Math.random() * list.length);
  return [list[a], list[b]];
}

export default function Unlock() {
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"pin" | "recover" | "reset">("pin");

  const [allQAs, setAllQAs] = useState<QA[]>([]);
  const [two, setTwo] = useState<QA[]>([]);
  const [ans1, setAns1] = useState("");
  const [ans2, setAns2] = useState("");

  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");

  useEffect(() => {
    (async () => {
      const pack = await loadSecurityPack();
      const qas = pack?.questions ?? [];
      setAllQAs(qas);
    })();
  }, []);

  const validPin = (p: string) => /^\d{4}$/.test(p);

  const onUnlock = async () => {
    if (!validPin(pin)) {
      Alert.alert("Invalid PIN", "Enter exactly 4 digits.");
      return;
    }
    const { pinHash, pinSalt } = await getPinHashAndSalt();
    if (!pinHash || !pinSalt) {
  Alert.alert("No PIN found", "Please enable App Lock from Settings first.");
  router.replace({ pathname: "/(tabs)/settings" });
  return;
}

    const attempt = await hashPin(pin, pinSalt);
    if (attempt === pinHash) {
  setUnlockedThisSession(true);
  router.replace({ pathname: "/(tabs)/home" });
}
 else {
      Alert.alert("Wrong PIN", "Try again, or use Forgot PIN.");
      setPin("");
    }
  };

  const startRecovery = () => {
    if (!allQAs || allQAs.length < 3) {
      Alert.alert("Recovery not available", "Security questions are missing.");
      return;
    }
    const chosen = pickTwoRandom(allQAs);
    setTwo(chosen);
    setAns1("");
    setAns2("");
    setMode("recover");
  };

  const verifyRecovery = () => {
    const a1ok = normalizeAnswer(ans1) === two[0]?.a;
    const a2ok = normalizeAnswer(ans2) === two[1]?.a;

    if (a1ok && a2ok) {
      setMode("reset");
      return;
    }
    Alert.alert("Incorrect answers", "Your answers didn’t match. Try again.");
  };

  const resetPinNow = async () => {
    if (!validPin(newPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmNewPin) {
      Alert.alert("PIN mismatch", "PIN and Confirm PIN must match.");
      return;
    }

    const salt = makeSalt();
    const pinHash = await hashPin(newPin, salt);
    await setPinHashAndSalt(pinHash, salt);

   Alert.alert("PIN Updated", "Your new PIN is saved.");
setUnlockedThisSession(true);
router.replace({ pathname: "/(tabs)/home" });

  };

  const Input = (props: any) => (
    <TextInput
      {...props}
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
      }}
    />
  );

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 14 }}>
      <Text style={{ fontSize: 22, fontWeight: "900", textAlign: "center" }}>
        {mode === "pin" ? "Unlock" : mode === "recover" ? "Recover PIN" : "Reset PIN"}
      </Text>

      {mode === "pin" && (
        <>
          <Input
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="Enter PIN"
          />

          <Pressable
            onPress={onUnlock}
            style={{ backgroundColor: "#111", padding: 14, borderRadius: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Unlock</Text>
          </Pressable>

          <Pressable onPress={startRecovery} style={{ padding: 12, alignItems: "center" }}>
            <Text style={{ fontWeight: "800" }}>Forgot PIN?</Text>
          </Pressable>

          <Pressable onPress={() => setPin("")} style={{ padding: 12, alignItems: "center" }}>
  <Text style={{ color: "#666" }}>Cancel</Text>
</Pressable>

        </>
      )}

      {mode === "recover" && (
        <>
          <Text style={{ fontWeight: "800" }}>Answer these 2 questions:</Text>

          <Text style={{ marginTop: 6, fontWeight: "700" }}>{two[0]?.q}</Text>
          <Input value={ans1} onChangeText={setAns1} placeholder="Answer 1" autoCapitalize="none" />

          <Text style={{ marginTop: 6, fontWeight: "700" }}>{two[1]?.q}</Text>
          <Input value={ans2} onChangeText={setAns2} placeholder="Answer 2" autoCapitalize="none" />

          <Pressable
            onPress={verifyRecovery}
            style={{ backgroundColor: "#111", padding: 14, borderRadius: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Verify</Text>
          </Pressable>

          <Pressable onPress={() => setMode("pin")} style={{ padding: 12, alignItems: "center" }}>
            <Text style={{ color: "#666" }}>Back</Text>
          </Pressable>
        </>
      )}

      {mode === "reset" && (
        <>
          <Text style={{ color: "#444" }}>Create a new 4-digit PIN.</Text>
          <Input
            value={newPin}
            onChangeText={setNewPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="New PIN"
          />
          <Input
            value={confirmNewPin}
            onChangeText={setConfirmNewPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="Confirm new PIN"
          />

          <Pressable
            onPress={resetPinNow}
            style={{ backgroundColor: "#111", padding: 14, borderRadius: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Save New PIN</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
