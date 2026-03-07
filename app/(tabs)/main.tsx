import { useEffect } from 'react';
import { View } from 'react-native';

import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import HelloCard from '../../components/HelloCard';
import { logger } from '../../tools/logger';
// Lavet så den kan kaldes over alt i projectet

export default function Main() {
  useEffect(() => {
    /**
     * # Eksempel use of logger
     * Basicly it does not make a difference if you are using, .log .debug .error og .log.
     * Its for code readbility,  So you can clearly state what you are trying to log.
     * ("Message that will come up in the log", Group it will be displayed in) <--- Parameter example
     */
    logger.debug('Loading Button component', 'components');
    logger.error('Returned status code 400', 'api');
    logger.log('Retuned error at main', 'main screen');
  }, []);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ marginBottom: 40 }} />
      <HelloCard title="Welcome to our very Hygge App" subtitle="" />
      <View style={{ marginBottom: 200 }} />
      <Dropdown selected="My apartments" />
      <View style={{ marginBottom: 40 }} />

      <Button
        label="Upload new floor plan"
        onPress={() => console.log('Button pressed')}
      />
      <View style={{ marginBottom: 40 }} />
      <Button
        label="Scan Area"
        onPress={() => {
          console.log('Button pressed');
          logger.debug('butten press', 'button pressed group');
        }}
      />
    </View>
  );
}
