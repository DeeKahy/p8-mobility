import { View, Text } from 'react-native';
import HelloCard from '../../components/HelloCard';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
export default function Main() {
  return (
    <View style={{  alignItems: 'center', justifyContent: 'center' }}>
          
      <div
      style={{ marginBottom: 40 }}
      />
        <HelloCard
        title="Velkommen Til vores Crazy seje app"
        subtitle=""
        
      />
      <div
      style={{ marginBottom: 200 }}
      />
      <Dropdown
      selected="My apartments"
      />
            <div
      style={{ marginBottom: 40 }}
      />
        <Button
        label="Upload new floor plan"
        onPress={() => console.log('Button pressed')}
      />
      <div
      style={{ marginBottom: 40 }}
      />
        <Button
        label="Scan Area"
        onPress={() => console.log('Button pressed')}
      />

    </View>
  );
}