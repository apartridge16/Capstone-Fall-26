import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { API_URL } from "../../constants/api";

type Program = {
  id: number;
  user_id: number;
  lift: string;
  starting_pr: number;
  goal_pr: number;
  goal_increase_percent: number;
  recommended_weeks: number;
  selected_weeks: number;
  current_week: number;
  initial_attainability: number;
  current_attainability: number;
  status: string;
  created_at: string;
};

const PROGRAM_LENGTHS = [6, 8, 10, 12, 14];

export default function ProgramDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [editGoalPR, setEditGoalPR] = useState(0);
  const [editSelectedWeeks, setEditSelectedWeeks] = useState(8);

  useEffect(() => {
    loadProgram();
  }, [id]);

  const loadProgram = async () => {
    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        router.replace("/sign-in");
        return;
      }

      const response = await fetch(
        `${API_URL}/programs/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        await SecureStore.deleteItemAsync("access_token");
        router.replace("/sign-in");
        return;
      }

      if (response.status === 404) {
        Alert.alert(
          "Program Not Found",
          "This program could not be found."
        );

        router.back();
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load program.");
      }

      const data: Program = await response.json();

      setProgram(data);
      setEditGoalPR(data.goal_pr);
      setEditSelectedWeeks(data.selected_weeks);
    } catch (error) {
      console.error("Load program error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load program."
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateGoalIncrease = () => {
    if (!program || program.starting_pr <= 0) {
      return 0;
    }

    return (
      ((editGoalPR - program.starting_pr) /
        program.starting_pr) *
      100
    );
  };

  const calculateAttainability = () => {
    const increase = calculateGoalIncrease();

    if (increase <= 0) {
      return 0;
    }

    // Base score decreases as the goal becomes more aggressive.
    const baseScore =
      95 - ((increase - 2.5) / (25 - 2.5)) * 40;

    let recommendedWeeks = 14;

    if (increase <= 5) {
      recommendedWeeks = 6;
    } else if (increase <= 10) {
      recommendedWeeks = 8;
    } else if (increase <= 15) {
      recommendedWeeks = 10;
    } else if (increase <= 20) {
      recommendedWeeks = 12;
    }

    const weekDifference =
      editSelectedWeeks - recommendedWeeks;

    let adjustment = 0;

    if (weekDifference > 0) {
      adjustment = (weekDifference / 2) * 4;
    } else if (weekDifference < 0) {
      adjustment = (weekDifference / 2) * 5;
    }

    return Math.max(
      20,
      Math.min(
        99,
        Math.round(baseScore + adjustment)
      )
    );
  };

  const increaseGoal = () => {
    if (!program) {
      return;
    }

    const maxGoal = Math.round(
      (program.starting_pr * 1.25) / 5
    ) * 5;

    setEditGoalPR((current) =>
      Math.min(current + 5, maxGoal)
    );
  };

  const decreaseGoal = () => {
    if (!program) {
      return;
    }

    const minGoal = Math.ceil(
      (program.starting_pr * 1.025) / 5
    ) * 5;

    setEditGoalPR((current) =>
      Math.max(current - 5, minGoal)
    );
  };

  const openEditForm = () => {
    if (!program) {
      return;
    }

    setEditGoalPR(program.goal_pr);
    setEditSelectedWeeks(program.selected_weeks);
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    if (!program) {
      return;
    }

    setEditGoalPR(program.goal_pr);
    setEditSelectedWeeks(program.selected_weeks);
    setShowEditForm(false);
  };

  const handleUpdateProgram = async () => {
    if (!program) {
      return;
    }

    const goalIncrease = calculateGoalIncrease();

    if (goalIncrease < 2.5 || goalIncrease > 25) {
      Alert.alert(
        "Invalid Goal",
        "Goal PR must be between 2.5% and 25% above your starting PR."
      );
      return;
    }

    if (editSelectedWeeks < program.current_week) {
      Alert.alert(
        "Invalid Program Length",
        "Program length cannot be shorter than your current week."
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

      const response = await fetch(
        `${API_URL}/programs/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            goal_pr: editGoalPR,
            selected_weeks: editSelectedWeeks,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to Update Program",
          data.detail || "Could not update the program."
        );
        return;
      }

      setProgram(data);
      setEditGoalPR(data.goal_pr);
      setEditSelectedWeeks(data.selected_weeks);
      setShowEditForm(false);

      Alert.alert(
        "Program Updated",
        "Your program changes have been saved."
      );
    } catch (error) {
      console.error("Update program error:", error);

      Alert.alert(
        "Connection Error",
        "Could not update the program."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProgram = () => {
    Alert.alert(
      "Delete Program",
      "This will permanently delete this program and its workout history. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteProgram,
        },
      ]
    );
  };

  const handleDeleteProgram = async () => {
    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        router.replace("/sign-in");
        return;
      }

      const response = await fetch(
        `${API_URL}/programs/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to Delete Program",
          data.detail || "Could not delete the program."
        );
        return;
      }

      router.replace("/programs");
    } catch (error) {
      console.error("Delete program error:", error);

      Alert.alert(
        "Connection Error",
        "Could not delete the program."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading program...
        </Text>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          Unable to load program.
        </Text>

        <TouchableOpacity
          style={styles.backToProgramsButton}
          onPress={() => router.replace("/programs")}
        >
          <Text style={styles.backToProgramsText}>
            Back to Programs
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedWeeks = Math.max(
    program.current_week - 1,
    0
  );

  const completionPercent =
    program.status === "completed"
      ? 100
      : Math.min(
          Math.round(
            (completedWeeks / program.selected_weeks) * 100
          ),
          100
        );

  const editedGoalIncrease = calculateGoalIncrease();
  const editedAttainability = calculateAttainability();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>
          ‹ My Programs
        </Text>
      </TouchableOpacity>

      <Text style={styles.status}>
        {program.status.toUpperCase()}
      </Text>

      <Text style={styles.title}>
        {program.lift}
      </Text>

      <Text style={styles.subtitle}>
        Strength Progression Program
      </Text>

      <View style={styles.goalCard}>
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>
            Starting PR
          </Text>

          <Text style={styles.goalValue}>
            {program.starting_pr} lb
          </Text>
        </View>

        <Text style={styles.goalArrow}>→</Text>

        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>
            Goal PR
          </Text>

          <Text style={styles.goalValue}>
            {program.goal_pr} lb
          </Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.cardLabel}>
              PROGRAM PROGRESS
            </Text>

            <Text style={styles.weekTitle}>
              Week {program.current_week} of{" "}
              {program.selected_weeks}
            </Text>
          </View>

          <Text style={styles.progressPercent}>
            {completionPercent}%
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${completionPercent}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressDescription}>
          {completedWeeks} of {program.selected_weeks} weeks
          completed
        </Text>
      </View>

      <TouchableOpacity
        style={styles.startWorkoutButton}
        onPress={() => {
          Alert.alert(
            "Feature Coming Soon :D"
          );
        }}
      >
        <Text style={styles.startWorkoutText}>
          Start Week {program.current_week} Workout
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        Program Details
      </Text>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Starting PR
          </Text>

          <Text style={styles.detailValue}>
            {program.starting_pr} lb
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Goal PR
          </Text>

          <Text style={styles.detailValue}>
            {program.goal_pr} lb
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Goal Increase
          </Text>

          <Text style={styles.detailValue}>
            +{program.goal_increase_percent.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Program Length
          </Text>

          <Text style={styles.detailValue}>
            {program.selected_weeks} weeks
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
                Current Attainability
            </Text>

            <Text style={styles.detailValue}>
                {program.current_attainability}/100
            </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
                Initial Attainability
        </Text>

        <Text style={styles.detailValue}>
            {program.initial_attainability}/100
        </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Workout History
      </Text>

      <View style={styles.emptyHistoryCard}>
        <Text style={styles.emptyHistoryTitle}>
          No workouts yet
        </Text>

        <Text style={styles.emptyHistoryText}>
          Your completed workouts will appear here as you
          progress through the program.
        </Text>
      </View>

      <Text style={styles.settingsTitle}>
        Program Settings
      </Text>

      {!showEditForm ? (
        <TouchableOpacity
          style={styles.settingButton}
          onPress={openEditForm}
        >
          <Text style={styles.settingButtonText}>
            Edit Program
          </Text>

          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>
            Edit Program
          </Text>

          <Text style={styles.editLabel}>
            Goal PR
          </Text>

          <View style={styles.goalEditor}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={decreaseGoal}
            >
              <Text style={styles.adjustButtonText}>−</Text>
            </TouchableOpacity>

            <View style={styles.editGoalValueContainer}>
              <Text style={styles.editGoalValue}>
                {editGoalPR} lb
              </Text>

              <Text style={styles.editGoalIncrease}>
                {editedGoalIncrease >= 0 ? "+" : ""}
                {editedGoalIncrease.toFixed(1)}%
              </Text>
            </View>

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={increaseGoal}
            >
              <Text style={styles.adjustButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.editLabel}>
            Program Length
          </Text>

          <View style={styles.weekOptions}>
            {PROGRAM_LENGTHS.map((weeks) => {
              const disabled = weeks < program.current_week;

              return (
                <TouchableOpacity
                  key={weeks}
                  style={[
                    styles.weekButton,
                    editSelectedWeeks === weeks &&
                      styles.weekButtonSelected,
                    disabled &&
                      styles.weekButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!disabled) {
                      setEditSelectedWeeks(weeks);
                    }
                  }}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.weekButtonText,
                      editSelectedWeeks === weeks &&
                        styles.weekButtonTextSelected,
                      disabled &&
                        styles.weekButtonTextDisabled,
                    ]}
                  >
                    {weeks}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.estimateCard}>
            <Text style={styles.estimateLabel}>
              Updated Estimated Attainability
            </Text>

            <Text style={styles.estimateValue}>
              {editedAttainability}/100
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProgram}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelEdit}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.dangerTitle}>
        Danger Zone
      </Text>

      <View style={styles.dangerCard}>
        <Text style={styles.dangerHeading}>
          Delete Program
        </Text>

        <Text style={styles.dangerDescription}>
          Permanently delete this program and its workout
          history. This cannot be undone.
        </Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDeleteProgram}
          disabled={saving}
        >
          <Text style={styles.deleteButtonText}>
            Delete Program
          </Text>
        </TouchableOpacity>
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

  centeredContainer: {
    flex: 1,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: {
    color: "#888888",
    fontSize: 14,
    marginTop: 12,
  },

  errorText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },

  backToProgramsButton: {
    marginTop: 20,
  },

  backToProgramsText: {
    color: "#3478f6",
    fontSize: 16,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 28,
  },

  backButtonText: {
    color: "#3478f6",
    fontSize: 18,
  },

  status: {
    color: "#3478f6",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
  },

  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#888888",
    fontSize: 16,
    marginTop: 7,
    marginBottom: 28,
  },

  goalCard: {
    backgroundColor: "#222222",
    borderRadius: 14,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  goalSection: {
    flex: 1,
  },

  goalLabel: {
    color: "#888888",
    fontSize: 13,
    marginBottom: 5,
  },

  goalValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },

  goalArrow: {
    color: "#3478f6",
    fontSize: 28,
    marginHorizontal: 15,
  },

  progressCard: {
    backgroundColor: "#222222",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardLabel: {
    color: "#888888",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },

  weekTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },

  progressPercent: {
    color: "#3478f6",
    fontSize: 26,
    fontWeight: "bold",
  },

  progressBackground: {
    height: 10,
    backgroundColor: "#333333",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 18,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#3478f6",
  },

  progressDescription: {
    color: "#777777",
    fontSize: 13,
    marginTop: 10,
  },

  startWorkoutButton: {
    backgroundColor: "#3478f6",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 35,
  },

  startWorkoutText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },

  detailsCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 35,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },

  detailLabel: {
    color: "#888888",
    fontSize: 14,
  },

  detailValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },

  emptyHistoryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 35,
  },

  emptyHistoryTitle: {
    color: "#cccccc",
    fontSize: 16,
    fontWeight: "600",
  },

  emptyHistoryText: {
    color: "#777777",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },

  settingsTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },

  settingButton: {
    backgroundColor: "#222222",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 35,
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

  editCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 20,
    marginBottom: 35,
  },

  editTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 22,
  },

  editLabel: {
    color: "#aaaaaa",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },

  goalEditor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  adjustButton: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },

  adjustButtonText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "600",
  },

  editGoalValueContainer: {
    alignItems: "center",
  },

  editGoalValue: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "bold",
  },

  editGoalIncrease: {
    color: "#888888",
    fontSize: 13,
    marginTop: 3,
  },

  weekOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  weekButton: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },

  weekButtonSelected: {
    backgroundColor: "#3478f6",
  },

  weekButtonDisabled: {
    opacity: 0.3,
  },

  weekButtonText: {
    color: "#cccccc",
    fontSize: 14,
    fontWeight: "600",
  },

  weekButtonTextSelected: {
    color: "#ffffff",
  },

  weekButtonTextDisabled: {
    color: "#777777",
  },

  estimateCard: {
    backgroundColor: "#222222",
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  estimateLabel: {
    color: "#aaaaaa",
    fontSize: 13,
    flex: 1,
  },

  estimateValue: {
    color: "#3478f6",
    fontSize: 18,
    fontWeight: "bold",
  },

  saveButton: {
    backgroundColor: "#3478f6",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  cancelButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#888888",
    fontSize: 15,
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
});