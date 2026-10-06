import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { API_URL } from "../constants/api";

type Lift = "Bench Press" | "Squat" | "Deadlift";

const LIFTS: Lift[] = ["Bench Press", "Squat", "Deadlift"];
const PROGRAM_LENGTHS = [6, 8, 10, 12, 14];

const MIN_INCREASE = 2.5;
const MAX_INCREASE = 25;

export default function NewProgram() {
  const [lift, setLift] = useState<Lift | null>(null);
  const [currentPR, setCurrentPR] = useState("");
  const [goalPercent, setGoalPercent] = useState(5);
  const [selectedWeeks, setSelectedWeeks] = useState(6);

  const currentPRNumber = Number(currentPR);

  // Round a weight to the nearest 5 lb.
  function roundToFive(weight: number) {
    return Math.round(weight / 5) * 5;
  }

  // Calculate the goal weight based on the selected percentage.
  const goalPR = useMemo(() => {
    if (!currentPRNumber || currentPRNumber <= 0) {
      return 0;
    }

    const calculatedGoal =
      currentPRNumber * (1 + goalPercent / 100);

    return roundToFive(calculatedGoal);
  }, [currentPRNumber, goalPercent]);

  // Because the goal weight is rounded to 5 lb increments,
  // calculate the actual percentage increase shown to the user.
  const actualIncrease = useMemo(() => {
    if (!currentPRNumber || currentPRNumber <= 0 || !goalPR) {
      return 0;
    }

    return ((goalPR - currentPRNumber) / currentPRNumber) * 100;
  }, [currentPRNumber, goalPR]);

  function getGoalClassification(percent: number) {
    if (percent <= 5) {
      return {
        name: "VERY ATTAINABLE",
        description:
          "A conservative strength increase with high expected attainability.",
      };
    }

    if (percent <= 10) {
      return {
        name: "ATTAINABLE",
        description:
          "A realistic strength goal with consistent training and recovery.",
      };
    }

    if (percent <= 15) {
      return {
        name: "CHALLENGING",
        description:
          "A significant strength increase requiring strong consistency.",
      };
    }

    if (percent <= 20) {
      return {
        name: "AGGRESSIVE",
        description:
          "A large strength increase with increased uncertainty.",
      };
    }

    return {
      name: "VERY AGGRESSIVE",
      description:
        "An exceptional strength increase with lower expected attainability within one program.",
    };
  }

  function getRecommendedWeeks(percent: number) {
    if (percent <= 5) {
      return 6;
    }

    if (percent <= 10) {
      return 8;
    }

    if (percent <= 15) {
      return 10;
    }

    if (percent <= 20) {
      return 12;
    }

    return 14;
  }


  function calculateAttainability(
    percent: number,
    weeks: number,
    recommendedWeeks: number
  ) {
    // Interpolate from approximately 95 at +2.5%
    // to approximately 55 at +25%.
    const difficultyPosition =
      (percent - MIN_INCREASE) /
      (MAX_INCREASE - MIN_INCREASE);

    let score = 95 - difficultyPosition * 40;

    const weekDifference = weeks - recommendedWeeks;

    if (weekDifference > 0) {
      // Extra time helps, but with diminishing benefit.
      score += (weekDifference / 2) * 4;
    } else if (weekDifference < 0) {
      // Shortening the program carries a larger penalty.
      score += (weekDifference / 2) * 5;
    }

    // Never display certainty.
    score = Math.min(score, 99);

    // Keep the score within a useful display range.
    score = Math.max(score, 20);

    return Math.round(score);
  }

  const classification =
    getGoalClassification(actualIncrease || goalPercent);

  const recommendedWeeks =
    getRecommendedWeeks(actualIncrease || goalPercent);

  const attainability = calculateAttainability(
    actualIncrease || goalPercent,
    selectedWeeks,
    recommendedWeeks
  );

  function decreaseGoal() {
    setGoalPercent((previous) =>
      Math.max(MIN_INCREASE, previous - 2.5)
    );
  }

  function increaseGoal() {
    setGoalPercent((previous) =>
      Math.min(MAX_INCREASE, previous + 2.5)
    );
  }

    const handleCreateProgram = async () => {
        if (!lift) {
        Alert.alert(
        "Select a Lift",
        "Please select Bench, Squat, or Deadlift."
        );
        return;
    }

    if (!currentPRNumber || currentPRNumber <= 0) {
        Alert.alert(
        "Invalid PR",
        "Please enter your current 1RM."
        );
        return;
    }

    try {
        const token = await SecureStore.getItemAsync("access_token");

        if (!token) {
        Alert.alert(
            "Authentication Error",
            "Please sign in again."
        );

        router.replace("/sign-in");
        return;
        }

        const response = await fetch(`${API_URL}/programs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            lift: lift,
            starting_pr: currentPRNumber,
            goal_pr: goalPR,
            goal_increase_percent: actualIncrease,
            recommended_weeks: recommendedWeeks,
            selected_weeks: selectedWeeks,
            initial_attainability: attainability,
        }),
        });

        if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.detail || "Unable to create program."
        );
        }

        await response.json();

        Alert.alert(
        "Program Created",
        `${lift}: ${currentPRNumber} lb → ${goalPR} lb\n${selectedWeeks} week program\nEstimated Attainability: ${attainability}/100`,
        [
            {
            text: "View Programs",
            onPress: () => router.replace("/programs"),
            },
        ]
        );
    } catch (error) {
        console.error("Create program error:", error);

        Alert.alert(
        "Error",
        error instanceof Error
            ? error.message
            : "Unable to create program."
        );
    }
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

      <Text style={styles.title}>New Program</Text>

      <Text style={styles.subtitle}>
        Build a progression plan for your next PR.
      </Text>

      {/* Lift Selection */}

      <Text style={styles.sectionTitle}>Choose Lift</Text>

      <View style={styles.liftContainer}>
        {LIFTS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.liftButton,
              lift === item && styles.liftButtonSelected,
            ]}
            onPress={() => setLift(item)}
          >
            <Text
              style={[
                styles.liftButtonText,
                lift === item && styles.liftButtonTextSelected,
              ]}
            >
              {item === "Bench Press" ? "Bench" : item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current PR */}

      <Text style={styles.sectionTitle}>Current PR</Text>

      <View style={styles.inputWithUnit}>
        <TextInput
          style={styles.numberInput}
          placeholder="225"
          placeholderTextColor="#777777"
          keyboardType="numeric"
          value={currentPR}
          onChangeText={setCurrentPR}
        />

        <Text style={styles.unit}>lb</Text>
      </View>

      {/* Goal Selection */}

      {currentPRNumber > 0 && (
        <>
          <Text style={styles.sectionTitle}>Goal PR</Text>

          <View style={styles.goalCard}>
            <Text style={styles.goalWeight}>
              {goalPR} lb
            </Text>

            <Text style={styles.increaseText}>
              +{actualIncrease.toFixed(1)}%
            </Text>

            <View style={styles.goalControls}>
              <TouchableOpacity
                style={[
                  styles.adjustButton,
                  goalPercent <= MIN_INCREASE &&
                    styles.adjustButtonDisabled,
                ]}
                onPress={decreaseGoal}
                disabled={goalPercent <= MIN_INCREASE}
              >
                <Text style={styles.adjustButtonText}>−</Text>
              </TouchableOpacity>

              <View style={styles.goalMiddle}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          ((goalPercent - MIN_INCREASE) /
                            (MAX_INCREASE - MIN_INCREASE)) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.rangeLabels}>
                  <Text style={styles.rangeText}>+2.5%</Text>
                  <Text style={styles.rangeText}>+25%</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.adjustButton,
                  goalPercent >= MAX_INCREASE &&
                    styles.adjustButtonDisabled,
                ]}
                onPress={increaseGoal}
                disabled={goalPercent >= MAX_INCREASE}
              >
                <Text style={styles.adjustButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.classificationContainer}>
              <Text style={styles.classification}>
                {classification.name}
              </Text>

              <Text style={styles.classificationDescription}>
                {classification.description}
              </Text>
            </View>
          </View>

          {/* Program Length */}

          <Text style={styles.sectionTitle}>
            Program Length
          </Text>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationLabel}>
              RECOMMENDED
            </Text>

            <Text style={styles.recommendationValue}>
              {recommendedWeeks} weeks
            </Text>

            <Text style={styles.recommendationText}>
              Based on your selected {actualIncrease.toFixed(1)}%
              strength increase.
            </Text>
          </View>

          <Text style={styles.chooseTimeText}>
            Choose your program length
          </Text>

          <View style={styles.weekContainer}>
            {PROGRAM_LENGTHS.map((weeks) => (
              <TouchableOpacity
                key={weeks}
                style={[
                  styles.weekButton,
                  selectedWeeks === weeks &&
                    styles.weekButtonSelected,
                ]}
                onPress={() => setSelectedWeeks(weeks)}
              >
                <Text
                  style={[
                    styles.weekNumber,
                    selectedWeeks === weeks &&
                      styles.weekNumberSelected,
                  ]}
                >
                  {weeks}
                </Text>

                <Text
                  style={[
                    styles.weekLabel,
                    selectedWeeks === weeks &&
                      styles.weekLabelSelected,
                  ]}
                >
                  weeks
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Attainability */}

          <View style={styles.attainabilityCard}>
            <Text style={styles.attainabilityLabel}>
              ESTIMATED ATTAINABILITY
            </Text>

            <Text style={styles.attainabilityScore}>
              {attainability}
              <Text style={styles.attainabilityOutOf}>
                /100
              </Text>
            </Text>

            <View style={styles.attainabilityBar}>
              <View
                style={[
                  styles.attainabilityFill,
                  {
                    width: `${attainability}%`,
                  },
                ]}
              />
            </View>

            {selectedWeeks > recommendedWeeks && (
              <Text style={styles.attainabilityDescription}>
                Giving yourself additional time may improve the
                attainability of your selected PR goal.
              </Text>
            )}

            {selectedWeeks === recommendedWeeks && (
              <Text style={styles.attainabilityDescription}>
                This is the recommended timeframe for your
                selected PR goal.
              </Text>
            )}

            {selectedWeeks < recommendedWeeks && (
              <Text style={styles.warningText}>
                This timeframe is shorter than recommended for
                your selected goal. Consider increasing your
                program length or reducing your goal.
              </Text>
            )}

            <Text style={styles.disclaimer}>
              This score is an estimate based on goal difficulty
              and program length. It is not a guaranteed
              probability of success.
            </Text>
          </View>

          {/* Summary */}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Program Summary
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lift</Text>
              <Text style={styles.summaryValue}>
                {lift || "Not selected"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Current PR
              </Text>
              <Text style={styles.summaryValue}>
                {currentPRNumber} lb
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Goal PR</Text>
              <Text style={styles.summaryValue}>
                {goalPR} lb
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Increase
              </Text>
              <Text style={styles.summaryValue}>
                +{actualIncrease.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Program
              </Text>
              <Text style={styles.summaryValue}>
                {selectedWeeks} weeks
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateProgram}
          >
            <Text style={styles.createButtonText}>
              Create Program
            </Text>
          </TouchableOpacity>
        </>
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
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 10,
  },

  liftContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },

  liftButton: {
    flex: 1,
    backgroundColor: "#222222",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },

  liftButtonSelected: {
    backgroundColor: "#3478f6",
    borderColor: "#3478f6",
  },

  liftButtonText: {
    color: "#aaaaaa",
    fontSize: 15,
    fontWeight: "600",
  },

  liftButtonTextSelected: {
    color: "#ffffff",
  },

  inputWithUnit: {
    backgroundColor: "#222222",
    borderRadius: 10,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  numberInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 20,
    padding: 16,
  },

  unit: {
    color: "#888888",
    fontSize: 16,
    paddingRight: 16,
  },

  goalCard: {
    backgroundColor: "#222222",
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
    alignItems: "center",
  },

  goalWeight: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "bold",
  },

  increaseText: {
    color: "#3478f6",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },

  goalControls: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 24,
  },

  adjustButton: {
    width: 44,
    height: 44,
    backgroundColor: "#3478f6",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  adjustButtonDisabled: {
    backgroundColor: "#333333",
  },

  adjustButtonText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "bold",
  },

  goalMiddle: {
    flex: 1,
    marginHorizontal: 14,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#444444",
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#3478f6",
  },

  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  rangeText: {
    color: "#777777",
    fontSize: 12,
  },

  classificationContainer: {
    width: "100%",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },

  classification: {
    color: "#3478f6",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  classificationDescription: {
    color: "#aaaaaa",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
  },

  recommendationCard: {
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },

  recommendationLabel: {
    color: "#3478f6",
    fontSize: 12,
    fontWeight: "bold",
  },

  recommendationValue: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 4,
  },

  recommendationText: {
    color: "#888888",
    fontSize: 14,
    marginTop: 5,
  },

  chooseTimeText: {
    color: "#cccccc",
    fontSize: 15,
    marginBottom: 12,
  },

  weekContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
  },

  weekButton: {
    flex: 1,
    backgroundColor: "#222222",
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },

  weekButtonSelected: {
    backgroundColor: "#3478f6",
    borderColor: "#3478f6",
  },

  weekNumber: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  weekNumberSelected: {
    color: "#ffffff",
  },

  weekLabel: {
    color: "#777777",
    fontSize: 10,
    marginTop: 2,
  },

  weekLabelSelected: {
    color: "#dbe7ff",
  },

  attainabilityCard: {
    backgroundColor: "#222222",
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },

  attainabilityLabel: {
    color: "#888888",
    fontSize: 12,
    fontWeight: "bold",
  },

  attainabilityScore: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "bold",
    marginTop: 6,
  },

  attainabilityOutOf: {
    color: "#777777",
    fontSize: 18,
  },

  attainabilityBar: {
    height: 10,
    backgroundColor: "#444444",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 12,
  },

  attainabilityFill: {
    height: "100%",
    backgroundColor: "#3478f6",
  },

  attainabilityDescription: {
    color: "#aaaaaa",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },

  warningText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },

  disclaimer: {
    color: "#666666",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
  },

  summaryCard: {
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
  },

  summaryTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summaryLabel: {
    color: "#888888",
    fontSize: 14,
  },

  summaryValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },

  createButton: {
    backgroundColor: "#3478f6",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
  },

  createButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});