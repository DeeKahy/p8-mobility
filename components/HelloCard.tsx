import { View, Text, StyleSheet } from 'react-native';

interface HelloCardProps {
  title: string;
  subtitle?: string;
}

export default function HelloCard({ title, subtitle }: HelloCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});
