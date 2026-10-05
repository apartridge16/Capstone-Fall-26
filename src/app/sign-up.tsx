import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { API_URL } from "../constants/api";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    // Make sure all fields are filled out
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    // Make sure both passwords match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    // Backend requires passwords to be at least 8 characters
    if (password.length < 8) {
      Alert.alert(
        "Error",
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setLoading(true);

      // Send the new account information to the backend
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      // Display an error returned by the backend
      if (!response.ok) {
        Alert.alert(
          "Sign Up Failed",
          data.detail || "Unable to create account."
        );
        return;
      }

      // Account was successfully created
      Alert.alert(
        "Account Created",
        "Your account was created successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/sign-in"),
          },
        ]
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Connection Error",
        "Could not connect to the Strength AI server."
      );
    } finally {
      setLoading(false);
    }
  }

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
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating Account..." : "Create Account"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/sign-in")}>
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