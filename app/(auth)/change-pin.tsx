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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getPinHashAndSalt, saveSecurityPack, setPinHashAndSalt } from "../../src/security/lock";
import { hashPin, makeSalt, normalizeAnswer } from "../../src/security/hash";

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: 13, fontWeight: "800", color: "#333" }}>{children}</Text>;
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#fff",
      }}
    />
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 16, padding: 14, gap: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: "900" }}>{title}</Text>
      {subtitle ? <Text style={{ color: "#555" }}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export default function ChangePin() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // refs for precise scrolling
  const a1WrapRef = useRef<View>(null);
  const a2WrapRef = useRef<View>(null);
  const a3WrapRef = useRef<View>(null);

  // PIN fields
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");

  // Security Q/A (mandatory)
  const [q1, setQ1] = useState(QUESTIONS[0]);
  const [a1, setA1] = useState("");
  const [q2, setQ2] = useState(QUESTIONS[1]);
  const [a2, setA2] = useState("");
  const [q3, setQ3] = useState(QUESTIONS[2]);
  const [a3, setA3] = useState("");

  // Modal picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("q1");

  const validPin = (p: string) => /^\d{4}$/.test(p);

  const uniqueQuestionsOk = useMemo(() => {
    const set = new Set([q1, q2, q3]);
    return set.size === 3;
  }, [q1, q2, q3]);

  // ✅ scroll to a specific view (bulletproof)
  const scrollToView = (v: View | null) => {
    if (!v) return;
    // wait a tick so layout + focus settle
    setTimeout(() => {
      // @ts-ignore - measureLayout exists at runtime for View refs
      v.measureLayout(
        // @ts-ignore - ScrollView ref has native node
        scrollRef.current,
        (_x: number, y: number) => {
          scrollRef.current?.scrollTo({ y: Math.max(y - 20, 0), animated: true });
        },
        () => {}
      );
    }, 60);
  };

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

  const pickerList = useMemo(() => {
    const chosen = new Set([q1, q2, q3]);
    const current = pickerTarget === "q1" ? q1 : pickerTarget === "q2" ? q2 : q3;
    return QUESTIONS.filter((q) => q === current || !chosen.has(q));
  }, [q1, q2, q3, pickerTarget]);

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
        backgroundColor: "#fff",
      }}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: "#666", fontSize: 12, fontWeight: "800" }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: "800" }} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>›</Text>
    </Pressable>
  );

  const onSave = async () => {
    // 1) Validate inputs
    if (!validPin(currentPin)) return Alert.alert("Invalid", "Current PIN must be exactly 4 digits.");
    if (!validPin(newPin)) return Alert.alert("Invalid", "New PIN must be exactly 4 digits.");
    if (newPin !== confirmNewPin) return Alert.alert("Mismatch", "New PIN and Confirm PIN must match.");
    if (!uniqueQuestionsOk) return Alert.alert("Duplicate questions", "Please choose 3 different questions.");
    if (!a1.trim() || !a2.trim() || !a3.trim())
      return Alert.alert("Missing answers", "Please answer all 3 security questions.");

    // 2) Verify current PIN
    const { pinHash, pinSalt } = await getPinHashAndSalt();
    if (!pinHash || !pinSalt) {
      Alert.alert("No PIN found", "Enable App Lock first from Settings.");
      router.replace({ pathname: "/(tabs)/settings" });
      return;
    }

    const attempt = await hashPin(currentPin, pinSalt);
    if (attempt !== pinHash) {
      Alert.alert("Wrong PIN", "Current PIN is incorrect.");
      setCurrentPin("");
      return;
    }

    // 3) Save new PIN + new security Q/A
    const newSalt = makeSalt();
    const newHash = await hashPin(newPin, newSalt);

    await setPinHashAndSalt(newHash, newSalt);
    await saveSecurityPack({
      questions: [
        { q: q1, a: normalizeAnswer(a1) },
        { q: q2, a: normalizeAnswer(a2) },
        { q: q3, a: normalizeAnswer(a3) },
      ],
    });

    Alert.alert("Updated", "PIN and security questions updated successfully.");
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 160 }}
        >
          <Text style={{ fontSize: 22, fontWeight: "900" }}>Change PIN</Text>
          <Text style={{ color: "#444" }}>
            Confirm your current PIN, choose a new PIN, and update your security questions for recovery.
          </Text>

          <Card title="Current PIN" subtitle="Enter your existing 4-digit PIN to continue.">
            <FieldLabel>Current PIN</FieldLabel>
            <Input
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="Enter current PIN"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </Card>

          <Card title="New PIN" subtitle="Choose a new 4-digit PIN.">
            <FieldLabel>New PIN</FieldLabel>
            <Input
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Create new 4-digit PIN"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />

            <FieldLabel>Confirm New PIN</FieldLabel>
            <Input
              value={confirmNewPin}
              onChangeText={setConfirmNewPin}
              placeholder="Re-enter new PIN"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </Card>

          <Card title="Security Questions" subtitle="Required for PIN recovery (choose 3 different).">
            <QuestionRow label="Question 1" value={q1} onPress={() => openPicker("q1")} />
            <View ref={a1WrapRef}>
              <Input
                value={a1}
                onChangeText={setA1}
                placeholder="Answer for question 1"
                autoCapitalize="none"
                onFocus={() => scrollToView(a1WrapRef.current)}
              />
            </View>

            <QuestionRow label="Question 2" value={q2} onPress={() => openPicker("q2")} />
            <View ref={a2WrapRef}>
              <Input
                value={a2}
                onChangeText={setA2}
                placeholder="Answer for question 2"
                autoCapitalize="none"
                onFocus={() => scrollToView(a2WrapRef.current)}
              />
            </View>

            <QuestionRow label="Question 3" value={q3} onPress={() => openPicker("q3")} />
            <View ref={a3WrapRef}>
              <Input
                value={a3}
                onChangeText={setA3}
                placeholder="Answer for question 3"
                autoCapitalize="none"
                onFocus={() => scrollToView(a3WrapRef.current)}
              />
            </View>

            {!uniqueQuestionsOk ? (
              <Text style={{ color: "#B00020", fontWeight: "800" }}>
                Please choose 3 different questions.
              </Text>
            ) : null}
          </Card>

          <Pressable
            onPress={onSave}
            style={{ backgroundColor: "#111", padding: 14, borderRadius: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Save Changes</Text>
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
            <Text style={{ fontWeight: "900" }}>Cancel</Text>
          </Pressable>
        </ScrollView>

        {/* Question Picker Modal */}
        <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
          <Pressable onPress={() => setPickerOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
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
                  <Text style={{ fontSize: 15, fontWeight: "800" }}>{q}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable onPress={() => setPickerOpen(false)} style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ fontWeight: "900", color: "#666" }}>Close</Text>
            </Pressable>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
