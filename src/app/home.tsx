import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Strength AI</Text>
      <Text style={styles.subtitle}>Welcome to the Home Page</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#111111",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#aaaaaa",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#3478f6",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
});