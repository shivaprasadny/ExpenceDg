import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { hashPin, makeSalt, normalizeAnswer } from "../../src/security/hash";
import { saveSecurityPack, setLockEnabled, setPinHashAndSalt } from "../../src/security/lock";

const QUESTIONS = [
  "What is your birth city?",
  "What was your first school name?",
  "What is your favorite food?",
  "What is your favorite movie?",
  "What is your best friend’s nickname?",
  "What is your mother’s maiden name?",
  "What was the name of your first pet?",
  "What is the name of your childhood street?",
  "What is your favorite teacher’s name?",
];

type PickerTarget = "q1" | "q2" | "q3";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 16, padding: 14, gap: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: "800" }}>{title}</Text>
      {children}
    </View>
  );
}

export default function SetupPin() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [q1, setQ1] = useState(QUESTIONS[0]);
  const [a1, setA1] = useState("");

  const [q2, setQ2] = useState(QUESTIONS[1]);
  const [a2, setA2] = useState("");

  const [q3, setQ3] = useState(QUESTIONS[2]);
  const [a3, setA3] = useState("");

  // Modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("q1");

  const validPin = (p: string) => /^\d{4}$/.test(p);

  const uniqueQuestionsOk = useMemo(() => {
    const set = new Set([q1, q2, q3]);
    return set.size === 3;
  }, [q1, q2, q3]);

  const openPicker = (target: PickerTarget) => {
    setPickerTarget(target);
    setPickerOpen(true);
  };

  const pickQuestion = (q: string) => {
    if (pickerTarget === "q1") setQ1(q);
    if (pickerTarget === "q2") setQ2(q);
    if (pickerTarget === "q3") setQ3(q);
    setPickerOpen(false);
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const onSave = async () => {
    if (!validPin(pin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert("PIN mismatch", "PIN and Confirm PIN must match.");
      return;
    }
    if (!uniqueQuestionsOk) {
      Alert.alert("Duplicate questions", "Please select 3 different security questions.");
      return;
    }
    if (!a1.trim() || !a2.trim() || !a3.trim()) {
      Alert.alert("Missing answers", "Please answer all 3 security questions.");
      return;
    }

    try {
      const salt = makeSalt();
      const pinHash = await hashPin(pin, salt);

      await setPinHashAndSalt(pinHash, salt);
      await saveSecurityPack({
        questions: [
          { q: q1, a: normalizeAnswer(a1) },
          { q: q2, a: normalizeAnswer(a2) },
          { q: q3, a: normalizeAnswer(a3) },
        ],
      });
      await setLockEnabled(true);

      Alert.alert("App Lock Enabled", "PIN + security questions saved.");
      router.replace({ pathname: "/(tabs)/settings" });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save PIN/security questions.");
    }
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

  const QuestionRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: "#666", fontSize: 12, fontWeight: "700" }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: "700" }} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>›</Text>
    </Pressable>
  );

  // Filter out already chosen questions for the picker target (so user can’t pick duplicates)
  const pickerList = useMemo(() => {
    const chosen = new Set([q1, q2, q3]);
    // Allow current selected question to remain selectable for that target
    const current =
      pickerTarget === "q1" ? q1 : pickerTarget === "q2" ? q2 : q3;

    return QUESTIONS.filter((q) => q === current || !chosen.has(q));
  }, [q1, q2, q3, pickerTarget]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 80 }}
      >
        <Text style={{ fontSize: 22, fontWeight: "900" }}>Enable App Lock</Text>
        <Text style={{ color: "#444" }}>
          Set a 4-digit PIN and 3 security questions (required for recovery).
        </Text>

        <Card title="PIN">
          <Input
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="Create 4-digit PIN"
          />
          <Input
  value={confirmPin}
  onChangeText={setConfirmPin}
  keyboardType="number-pad"
  maxLength={4}
  secureTextEntry
  placeholder="Confirm PIN"
/>

        </Card>

        <Card title="Security Questions (Required)">
          <QuestionRow label="Question 1" value={q1} onPress={() => openPicker("q1")} />
          <Input
            value={a1}
            onChangeText={setA1}
            placeholder="Answer 1"
            autoCapitalize="none"

          />

          <QuestionRow label="Question 2" value={q2} onPress={() => openPicker("q2")} />
          <Input
            value={a2}
            onChangeText={setA2}
            placeholder="Answer 2"
            autoCapitalize="none"
 onFocus={scrollToBottom}
          />

          <QuestionRow label="Question 3" value={q3} onPress={() => openPicker("q3")} />
          <Input
  value={a3}
  onChangeText={setA3}
  placeholder="Answer 3"
  autoCapitalize="none"
  onFocus={scrollToBottom}
/>


          {!uniqueQuestionsOk ? (
            <Text style={{ color: "#B00020", fontWeight: "700" }}>
              Please choose 3 different questions.
            </Text>
          ) : null}
        </Card>

        <Pressable
          onPress={onSave}
          style={{
            backgroundColor: "#111",
            padding: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Save & Enable</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{
            padding: 14,
            borderRadius: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <Text style={{ fontWeight: "800" }}>Cancel</Text>
        </Pressable>
      </ScrollView>

      {/* Question Picker Modal */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable
          onPress={() => setPickerOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        />
        <View
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderWidth: 1,
            borderColor: "#eee",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", marginBottom: 10 }}>Select a question</Text>

          <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {pickerList.map((q) => (
              <Pressable
                key={q}
                onPress={() => pickQuestion(q)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#eee",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700" }}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => setPickerOpen(false)}
            style={{ padding: 12, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "900", color: "#666" }}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
