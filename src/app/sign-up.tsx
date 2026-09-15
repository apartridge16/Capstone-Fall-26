import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function SignUp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Get started with Strength AI</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/home")}
      >
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#111111",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#aaaaaa",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#222222",
    color: "#ffffff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3478f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  link: {
    color: "#3478f6",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});