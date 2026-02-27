import { View, Text } from 'react-native';
import HelloCard from '../../components/HelloCard';
export default function Main() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <HelloCard
        title="Velkommen 👋"
        subtitle="Dette er din main page"
      />
    </View>
  );
}