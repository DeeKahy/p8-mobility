import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLogger } from '../../context/LoggerContext';
import { useState } from 'react';

type GroupedLogs = Record<string, any[]>;


function group_log_by_group(logs: any): { groupedLogs: GroupedLogs } {
  const groupedLogs: GroupedLogs = {};
  logs.forEach((logEntry: { group: string; }) => {
    const groupName = logEntry.group;
    if (!groupedLogs[groupName]) {// Adds the "group" for example API to the object So  API:[]
      groupedLogs[groupName] = [];
    }
    groupedLogs[groupName].push(logEntry);// Then API :[log entry]

  });
  return { groupedLogs }
}
// Renders all the log entries in a group.
function renderedLogsf(logsInGroup: any[]) {
  if (logsInGroup == null) {
    return 1;
  }
  return logsInGroup.map((logEntry: any) => (
    <View key={logEntry.id} style={styles.logItem} nativeID="log-entry-container">
      <Text style={styles.time}>
        {new Date(logEntry.timestamp).toLocaleTimeString()}
      </Text>
      <Text style={styles.message}>{logEntry.message}</Text>
    </View>
  ));
}

function renderGroups(
  logsGroupedByGroup: Record<string, any[]>,
  openGroups: Record<string, boolean>,
  toggleGroupVisibility: (groupName: string) => void
) {
  return Object.entries(logsGroupedByGroup).map(
    ([groupName, logsInGroup]) => {
      const arrow = openGroups[groupName] ? '▼' : '▶';

      let renderedLogs = null;

      if (openGroups[groupName]) {
        renderedLogs = renderedLogsf(logsInGroup);
      }

      return (
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
    }
  );
}

export default function Debug() {
  const { logs, clearLogs } = useLogger();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const logsGroupedByGroup = group_log_by_group(logs).groupedLogs

  // Handles the logic for toggle down. Since we use State to update if its shown or not we cannot simply
  // Do state = newstate,  As React will notice this as a "newstate" It detects if we reasign to new place in memmory
  // We therefore needs to return somthing new. witch is why we do Object.assign() and return it.
  const toggleGroupVisibility = (groupName: string) => {
    setOpenGroups((previousState) => {
      const updatedState = Object.assign({}, previousState);

      if (updatedState[groupName] === true) {
        updatedState[groupName] = false;
      } else {
        updatedState[groupName] = true;
      }

      return updatedState;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debugger</Text>
      <Pressable style={styles.clearButton} onPress={clearLogs} nativeID='Button-to-clear-logs'>
        <Text style={styles.clearText}>Clear Logs</Text>
      </Pressable>
      <ScrollView style={styles.logContainer} nativeID='Log group container'>
        {renderGroups(logsGroupedByGroup, openGroups, toggleGroupVisibility)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  clearButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },

  clearText: {
    color: 'white',
    fontWeight: '600',
  },

  logContainer: {
    width: '90%',
  },

  group: {
    marginBottom: 12,
  },

  groupHeader: {
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 8,
  },

  groupTitle: {
    fontWeight: '600',
    fontSize: 16,
  },

  logItem: {
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  time: {
    fontSize: 12,
    color: '#666',
  },

  message: {
    fontSize: 14,
  },
});