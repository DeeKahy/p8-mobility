import { View } from 'react-native';

import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import HelloCard from '../../components/HelloCard';
export default function Main() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ marginBottom: 40 }} />
      <HelloCard title="Velkommen Til vores Crazy seje app" subtitle="" />
      <View style={{ marginBottom: 200 }} />
      <Dropdown selected="My apartments" />
      <View style={{ marginBottom: 40 }} />
      <Button
        label="Upload new floor plan"
        onPress={() => console.log('Button pressed')}
      />
      <View style={{ marginBottom: 40 }} />
      <Button label="Scan Area" onPress={() => console.log('Button pressed')} />
    </View>
  );
}
