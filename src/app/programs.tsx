import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { API_URL } from "../constants/api";

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
  current_attainability: number;
  status: string;
  created_at: string;
};

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrograms = async () => {
    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("access_token");

      if (!token) {
        router.replace("/sign-in");
        return;
      }

      const response = await fetch(`${API_URL}/programs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        await SecureStore.deleteItemAsync("access_token");
        router.replace("/sign-in");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load programs.");
      }

      const data: Program[] = await response.json();

      setPrograms(data);
    } catch (error) {
      console.error("Load programs error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load programs."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPrograms();
    }, [])
  );

  const activePrograms = programs.filter(
    (program) => program.status === "active"
  );

  const completedPrograms = programs.filter(
    (program) => program.status === "completed"
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>My Programs</Text>

        <Text style={styles.subtitle}>
          Track your progress toward your next PR.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Programs</Text>

        <TouchableOpacity
          onPress={() => router.push("/new-program")}
        >
          <Text style={styles.addProgram}>+ New Program</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Loading programs...
          </Text>
        </View>
      ) : activePrograms.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No active programs.
          </Text>

          <Text style={styles.emptySubtext}>
            Create a program to start working toward your next PR.
          </Text>
        </View>
      ) : (
        activePrograms.map((program) => {
          // current_week represents the week the user is currently on.
          // Therefore, completed weeks are one less than current_week.
          const completedWeeks = Math.max(
            program.current_week - 1,
            0
          );

          const completionPercent = Math.min(
            Math.round(
              (completedWeeks / program.selected_weeks) * 100
            ),
            100
          );

          return (
            <TouchableOpacity
              key={program.id}
              style={styles.programCard}
              onPress={() =>
                    router.push({
                        pathname: "/program/[id]",
                        params: {
                        id: program.id.toString(),
                        },
                    })
                }
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.status}>
                    {program.status.toUpperCase()}
                  </Text>

                  <Text style={styles.liftName}>
                    {program.lift}
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </View>

              <View style={styles.goalContainer}>
                <View>
                  <Text style={styles.goalLabel}>
                    Starting PR
                  </Text>

                  <Text style={styles.goalValue}>
                    {program.starting_pr} lb
                  </Text>
                </View>

                <Text style={styles.goalArrow}>→</Text>

                <View>
                  <Text style={styles.goalLabel}>
                    Goal PR
                  </Text>

                  <Text style={styles.goalValue}>
                    {program.goal_pr} lb
                  </Text>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    Increase
                  </Text>

                  <Text style={styles.detailValue}>
                    +{program.goal_increase_percent.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    Program
                  </Text>

                  <Text style={styles.detailValue}>
                    {program.selected_weeks} weeks
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    Attainability
                  </Text>

                  <Text style={styles.detailValue}>
                    {program.current_attainability}/100
                  </Text>
                </View>
              </View>

              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  Week {program.current_week} of{" "}
                  {program.selected_weeks}
                </Text>

                <Text style={styles.progressPercent}>
                  {completionPercent}% complete
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
            </TouchableOpacity>
          );
        })
      )}

      <Text style={styles.completedTitle}>
        Completed Programs
      </Text>

      {completedPrograms.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No completed programs yet.
          </Text>

          <Text style={styles.emptySubtext}>
            Completed PR programs will appear here.
          </Text>
        </View>
      ) : (
        completedPrograms.map((program) => (
          <View
            key={program.id}
            style={styles.completedCard}
          >
            <Text style={styles.completedLift}>
              {program.lift}
            </Text>

            <Text style={styles.completedGoal}>
              {program.starting_pr} lb → {program.goal_pr} lb
            </Text>
          </View>
        ))
      )}
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
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 25,
  },

  backButtonText: {
    color: "#3478f6",
    fontSize: 18,
  },

  header: {
    marginBottom: 35,
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
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },

  addProgram: {
    color: "#3478f6",
    fontSize: 15,
    fontWeight: "600",
  },

  loadingContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    marginBottom: 35,
  },

  loadingText: {
    color: "#888888",
    fontSize: 14,
    marginTop: 12,
  },

  programCard: {
    backgroundColor: "#222222",
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  status: {
    color: "#3478f6",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },

  liftName: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },

  arrow: {
    color: "#888888",
    fontSize: 34,
  },

  goalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
  },

  goalLabel: {
    color: "#888888",
    fontSize: 13,
    marginBottom: 4,
  },

  goalValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },

  goalArrow: {
    color: "#3478f6",
    fontSize: 24,
  },

  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    color: "#777777",
    fontSize: 12,
    marginBottom: 4,
  },

  detailValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 8,
  },

  progressText: {
    color: "#cccccc",
    fontSize: 13,
  },

  progressPercent: {
    color: "#888888",
    fontSize: 13,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#333333",
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#3478f6",
  },

  completedTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 15,
  },

  emptyCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 22,
    alignItems: "center",
    marginBottom: 20,
  },

  emptyText: {
    color: "#cccccc",
    fontSize: 16,
    fontWeight: "600",
  },

  emptySubtext: {
    color: "#777777",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },

  completedCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },

  completedLift: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },

  completedGoal: {
    color: "#888888",
    fontSize: 14,
    marginTop: 5,
  },
});