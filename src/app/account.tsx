import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { API_URL } from "../constants/api";

export default function Account() {
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");

  const [saving, setSaving] = useState(false);

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
        setNewEmail(data.email);
        setCreatedAt(data.created_at);
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

  async function handleUpdateEmail() {
    if (!newEmail.trim()) {
      Alert.alert(
        "Missing Email",
        "Please enter a new email address."
      );
      return;
    }

    if (!emailPassword) {
      Alert.alert(
        "Password Required",
        "Please enter your current password."
      );
      return;
    }

    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        router.replace("/sign-in");
        return;
      }

      const response = await fetch(`${API_URL}/account`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          current_password: emailPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to Update Email",
          data.detail || "Could not update your email."
        );
        return;
      }

      setEmail(data.email);
      setNewEmail(data.email);
      setEmailPassword("");
      setShowEmailForm(false);

      Alert.alert(
        "Email Updated",
        "Your email address has been updated."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Connection Error",
        "Could not update your email."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword() {
    if (!currentPassword) {
      Alert.alert(
        "Current Password Required",
        "Please enter your current password."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Your new password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure your new passwords match."
      );
      return;
    }

    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        router.replace("/sign-in");
        return;
      }

      const response = await fetch(`${API_URL}/account`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to Update Password",
          data.detail || "Could not update your password."
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

      Alert.alert(
        "Password Updated",
        "Your password has been updated."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Connection Error",
        "Could not update your password."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteAccount() {
    if (!deletePassword) {
      Alert.alert(
        "Password Required",
        "Please enter your password before deleting your account."
      );
      return;
    }

    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all of your programs. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ]
    );
  }

  async function handleDeleteAccount() {
    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        router.replace("/sign-in");
        return;
      }

      const response = await fetch(`${API_URL}/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to Delete Account",
          data.detail || "Could not delete your account."
        );
        return;
      }

      // Delete the saved JWT after the account is deleted
      await SecureStore.deleteItemAsync("access_token");

      router.replace("/sign-in");
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Connection Error",
        "Could not delete your account."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    // Delete the saved JWT
    await SecureStore.deleteItemAsync("access_token");

    router.replace("/sign-in");
  }

  function formatCreatedDate(date: string) {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Account</Text>

      <Text style={styles.subtitle}>
        Manage your Strength AI account.
      </Text>

      <Text style={styles.sectionTitle}>
        Account Information
      </Text>

      <View style={styles.infoContainer}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {formatCreatedDate(createdAt)}
              </Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>
        Account Settings
      </Text>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => {
          setShowEmailForm(!showEmailForm);
          setShowPasswordForm(false);
        }}
      >
        <Text style={styles.settingButtonText}>
          Change Email
        </Text>

        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      {showEmailForm && (
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>
            New Email
          </Text>

          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="New email"
            placeholderTextColor="#666666"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>
            Current Password
          </Text>

          <TextInput
            style={styles.input}
            value={emailPassword}
            onChangeText={setEmailPassword}
            placeholder="Current password"
            placeholderTextColor="#666666"
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateEmail}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Update Email"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => {
          setShowPasswordForm(!showPasswordForm);
          setShowEmailForm(false);
        }}
      >
        <Text style={styles.settingButtonText}>
          Change Password
        </Text>

        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      {showPasswordForm && (
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>
            Current Password
          </Text>

          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor="#666666"
            secureTextEntry
          />

          <Text style={styles.inputLabel}>
            New Password
          </Text>

          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor="#666666"
            secureTextEntry
          />

          <Text style={styles.inputLabel}>
            Confirm New Password
          </Text>

          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#666666"
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdatePassword}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>
          Sign Out
        </Text>
      </TouchableOpacity>

      <Text style={styles.dangerTitle}>
        Danger Zone
      </Text>

      <View style={styles.dangerCard}>
        <Text style={styles.dangerHeading}>
          Delete Account
        </Text>

        <Text style={styles.dangerDescription}>
          Permanently delete your account and all of your
          strength programs.
        </Text>

        {!showDeleteForm ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteForm(true)}
          >
            <Text style={styles.deleteButtonText}>
              Delete Account
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.inputLabel}>
              Confirm Password
            </Text>

            <TextInput
              style={styles.input}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Enter your password"
              placeholderTextColor="#666666"
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDeleteAccount}
              disabled={saving}
            >
              <Text style={styles.deleteButtonText}>
                {saving
                  ? "Deleting..."
                  : "Permanently Delete Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelDeleteButton}
              onPress={() => {
                setShowDeleteForm(false);
                setDeletePassword("");
              }}
            >
              <Text style={styles.cancelDeleteText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },

  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 65,
    paddingBottom: 50,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 25,
  },

  backButtonText: {
    color: "#3478f6",
    fontSize: 18,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#ffffff",
  },

  subtitle: {
    fontSize: 16,
    color: "#888888",
    marginTop: 8,
    marginBottom: 35,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },

  infoContainer: {
    backgroundColor: "#222222",
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 35,
    minHeight: 80,
    justifyContent: "center",
  },

  infoRow: {
    paddingVertical: 17,
  },

  label: {
    fontSize: 13,
    color: "#888888",
    marginBottom: 5,
  },

  value: {
    fontSize: 17,
    color: "#ffffff",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#333333",
  },

  settingButton: {
    backgroundColor: "#222222",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  settingButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  settingArrow: {
    color: "#888888",
    fontSize: 25,
  },

  formCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 18,
    marginBottom: 12,
  },

  inputLabel: {
    color: "#aaaaaa",
    fontSize: 13,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 16,
  },

  saveButton: {
    backgroundColor: "#3478f6",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  signOutButton: {
    backgroundColor: "#333333",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
  },

  signOutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  dangerTitle: {
    color: "#ff5c5c",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },

  dangerCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
  },

  dangerHeading: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  dangerDescription: {
    color: "#888888",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#ff5c5c",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#ff5c5c",
    fontSize: 15,
    fontWeight: "bold",
  },

  cancelDeleteButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 5,
  },

  cancelDeleteText: {
    color: "#888888",
    fontSize: 15,
  },
});