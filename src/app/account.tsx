import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { API_URL } from "../constants/api";

export default function Account() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      try {
        // Get the saved JWT
        const token = await SecureStore.getItemAsync("access_token");

        if (!token) {
          router.replace("/sign-in");
          return;
        }

        // Request the logged-in user's account information
        const response = await fetch(`${API_URL}/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        // Token is invalid or expired
        if (!response.ok) {
          await SecureStore.deleteItemAsync("access_token");
          router.replace("/sign-in");
          return;
        }

        // Save the user's email returned by the backend
        setEmail(data.email);
      } catch (error) {
        console.error(error);

        Alert.alert(
          "Connection Error",
          "Could not load your account information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  async function handleSignOut() {
    // Delete the saved JWT
    await SecureStore.deleteItemAsync("access_token");

    router.replace("/sign-in");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email</Text>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.value}>{email}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
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
    paddingHorizontal: 30,
    backgroundColor: "#111111",
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 40,
  },

  infoContainer: {
    backgroundColor: "#222222",
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    color: "#aaaaaa",
    marginBottom: 5,
  },

  value: {
    fontSize: 18,
    color: "#ffffff",
  },

  button: {
    backgroundColor: "#3478f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },

  signOutButton: {
    backgroundColor: "#333333",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
});