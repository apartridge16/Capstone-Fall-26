import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Home() {

    async function handleSignOut() {
    await SecureStore.deleteItemAsync("access_token");
    router.replace("/sign-in");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Strength AI</Text>
      <Text style={styles.subtitle}>Welcome to the Home Page</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/account")}
      >
        <Text style={styles.buttonText}>Account</Text>
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
    alignItems: "center",
    width: 200,
  },

  signOutButton: {
    backgroundColor: "#333333",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: "center",
    width: 200,
    marginTop: 15,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
});