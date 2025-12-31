import { View, Text } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>ExpenseDg</Text>
      <Text style={{ marginTop: 8 }}>✅ Tabs working. ✅ DB init on launch.</Text>
      <Text style={{ marginTop: 8 }}>Next: PIN setup + unlock flow.</Text>
    </View>
  );
}
