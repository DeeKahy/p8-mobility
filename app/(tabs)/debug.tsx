import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFloorplan } from "../../context/FloorplanContext";
import { type LogEntry, useLogger } from "../../context/LoggerContext";

type GroupedLogs = Record<string, LogEntry[]>;

function groupLogsByGroup(logs: LogEntry[]): GroupedLogs {
  const groupedLogs: GroupedLogs = {};
  // Adds the "group" for example API to the object So  API:[]
  logs.forEach((logEntry) => {
    if (!groupedLogs[logEntry.group]) {
      groupedLogs[logEntry.group] = [];
    }

    groupedLogs[logEntry.group].push(logEntry); // Then API :[log entry]
  });

  return groupedLogs;
}

// Renders all the log entries in a group.
function renderLogs(logsInGroup: LogEntry[]) {
  const renderedLogs: React.ReactNode[] = [];

  logsInGroup.forEach((logEntry) => {
    renderedLogs.push(
      <View
        key={logEntry.id}
        style={styles.logItem}
        nativeID="log-entry-container"
      >
        <Text style={styles.time}>
          {new Date(logEntry.timestamp).toLocaleTimeString()}
        </Text>
        <Text style={styles.message}>{logEntry.message}</Text>
      </View>
    );
  });

  return renderedLogs;
}

// Renders all the groups
function renderGroups(
  logsGroupedByGroup: GroupedLogs,
  openGroups: Record<string, boolean>,
  toggleGroupVisibility: (groupName: string) => void
) {
  const groups = Object.entries(logsGroupedByGroup).map(
    ([groupName, logsInGroup]) => {
      let arrow;
      if (openGroups[groupName]) {
        arrow = "▼";
      } else {
        arrow = "▶";
      }
      let renderedLogs = null;

      if (openGroups[groupName]) {
        renderedLogs = renderLogs(logsInGroup);
      }

      const groupcontainer = (
        <View
          key={groupName}
          style={styles.group}
          nativeID="Log-group-container"
        >
          <Pressable
            style={styles.groupHeader}
            onPress={() => toggleGroupVisibility(groupName)}
          >
            <Text style={styles.groupTitle}>
              {arrow} {groupName}
            </Text>
          </Pressable>

          {renderedLogs}
        </View>
      );
      return groupcontainer;
    }
  );
  return groups;
}

export default function Debug() {
  const { logs, clearLogs, log, error } = useLogger();
  const { clearAllUserData } = useFloorplan();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const logsGroupedByGroup = groupLogsByGroup(logs);
  // Handles the logic for toggle down. Since we use State to update if it's shown or not, we cannot simply do state = newState, as React will notice this as a "newState". It detects if we reassign to a new place in memory. We therefore need to return something new, which is why we do Object.assign() and return it.
  const toggleGroupVisibility = (groupName: string) => {
    setOpenGroups((previousState) => {
      const updatedState = Object.assign({}, previousState);
      updatedState[groupName] = !updatedState[groupName];
      return updatedState;
    });
  };

  const confirmClearAllUserData = () => {
    Alert.alert(
      "Clear all user data",
      "This will delete all saved floorplans and markers for the current user on the server.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllUserData();
              log("Cleared all user data from the server");
            } catch (caughtError) {
              const errorMessage =
                caughtError instanceof Error
                  ? caughtError.message
                  : "Unknown error";
              error(`Clearing all user data failed: ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  const page = (
    <View style={styles.container}>
      <Text style={styles.title}>Debugger</Text>

      <Pressable
        style={styles.clearButton}
        onPress={clearLogs}
        nativeID="Button-to-clear-logs"
      >
        <Text style={styles.clearText}>Clear Logs</Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={confirmClearAllUserData}
        nativeID="Button-to-clear-all-user-data"
      >
        <Text style={styles.clearText}>Clear All User Data</Text>
      </Pressable>

      <ScrollView style={styles.logContainer} nativeID="Log group container">
        {renderGroups(logsGroupedByGroup, openGroups, toggleGroupVisibility)}
      </ScrollView>
    </View>
  );
  return page;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  clearButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  deleteButton: {
    backgroundColor: "#8b0000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },

  clearText: {
    color: "white",
    fontWeight: "600",
  },

  logContainer: {
    width: "90%",
  },

  group: {
    marginBottom: 12,
  },

  groupHeader: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 8,
  },

  groupTitle: {
    fontWeight: "600",
    fontSize: 16,
  },

  logItem: {
    backgroundColor: "white",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  time: {
    fontSize: 12,
    color: "#666",
  },

  message: {
    fontSize: 14,
  },
});
