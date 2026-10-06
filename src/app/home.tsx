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
      <View style={styles.header}>
        <Text style={styles.title}>Strength AI</Text>
        <Text style={styles.subtitle}>
          Train Smarter Not Harder
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Dashboard AI
        </Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push("/new-program")}
        >
          <Text style={styles.startButtonText}>
            Start New Program
          </Text>

          <Text style={styles.startButtonSubtext}>
            Create a new strength progression plan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push("/programs")}
        >
          <View>
            <Text style={styles.menuButtonTitle}>
              My Programs
            </Text>

            <Text style={styles.menuButtonText}>
              View active and completed programs
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push("/account")}
        >
          <View>
            <Text style={styles.menuButtonTitle}>
              Account
            </Text>

            <Text style={styles.menuButtonText}>
              View your account information
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 50,
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },

  subtitle: {
    fontSize: 17,
    color: "#888888",
    marginTop: 5,
  },

  content: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },

  startButton: {
    backgroundColor: "#3478f6",
    padding: 22,
    borderRadius: 12,
    marginBottom: 20,
  },

  startButtonText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
  },

  startButtonSubtext: {
    color: "#dbe7ff",
    fontSize: 14,
    marginTop: 5,
  },

  menuButton: {
    backgroundColor: "#222222",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuButtonTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },

  menuButtonText: {
    color: "#888888",
    fontSize: 14,
    marginTop: 4,
  },

  arrow: {
    color: "#888888",
    fontSize: 30,
  },

  signOutButton: {
    alignItems: "center",
    padding: 15,
  },

  signOutText: {
    color: "#888888",
    fontSize: 16,
  },
});