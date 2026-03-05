import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLogger } from '../../context/LoggerContext';
import { useState } from 'react';

export default function Debug() {
  const { logs, clearLogs } = useLogger();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const logsGroupedByGroup = logs.reduce(
    // Reduce is taking every element from logs array and then hands it over to our function. and acumulates it in or groupedLogs.
    //(Acc, List_element)  
    (groupedLogs: Record<string, any[]>, logEntry) => {
      const groupName = logEntry.group;

      if (!groupedLogs[groupName]) {// Adds the "group" for example API to the object So  API:[]
        groupedLogs[groupName] = [];
      }

      groupedLogs[groupName].push(logEntry);// Then API :[logenentry]

      return groupedLogs;
    },
    {}//Original acc Starting "value"  Cant be left empty as developers could no bear to simpel make the default argument ={} idk why
  );

  const toggleGroupVisibility = (groupName: string) => {
    setOpenGroups((previousState) => {
      const updatedState = { ...previousState };

      updatedState[groupName] = !previousState[groupName];

      return updatedState;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debugger</Text>

      <Pressable style={styles.clearButton} onPress={clearLogs}>
        <Text style={styles.clearText}>Clear Logs</Text>
      </Pressable>

      <ScrollView style={styles.logContainer}>
        {Object.entries(logsGroupedByGroup).map(
          ([groupName, logsInGroup]: any) => {
            const arrow = openGroups[groupName] ? '▼' : '▶';

            let renderedLogs = null;

            if (openGroups[groupName]) {
              renderedLogs = logsInGroup.map((logEntry: any) => (
                <View key={logEntry.id} style={styles.logItem}>
                  <Text style={styles.time}>
                    {new Date(logEntry.timestamp).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.message}>{logEntry.message}</Text>
                </View>
              ));
            }

            return (
              <View key={groupName} style={styles.group}>
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
        )}
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