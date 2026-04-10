import { View } from 'react-native';

import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import HelloCard from '../../components/HelloCard';
import { useToast } from '../../context/ToastProvider';

export default function Main() {
  const { showToast } = useToast();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ marginBottom: 40 }} />
      <HelloCard title="Welcome to our very Hygge App" subtitle="" />
      <View style={{ marginBottom: 200 }} />
      <Dropdown selected="My apartments" />
      <View style={{ marginBottom: 40 }} />
      <Button
        label="Upload new floor plan"
        onPress={() => {
          console.log('Button pressed');
        }}
      />
      {/* Example of how to call */}
      <Button
        label="Maksim"
        onPress={() => {
          console.log('Button pressed');
          showToast('Image has been uploaded', 'Success');
        }}
      />
    </View>
  );
}
