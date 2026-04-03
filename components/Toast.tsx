import React, { useEffect } from 'react';
import { Animated, Text, StyleSheet, useAnimatedValue } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type ToastMessage = {
  type: 'Success' | 'Error' | 'Info';
  message: string;
  onRemove: () => void;
};

export const Toast = (props: ToastMessage) => {
  const fadeAnim = useAnimatedValue(0);

  const fade = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => props.onRemove());
    }, 2000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Success':
        return '#5DB996';
      case 'Error':
        return '#FF748B';
      case 'Info':
        return '#074799';
    }
  };

  useEffect(() => {
    fade();
  }, []);

  return (
    <SafeAreaProvider>
      <Animated.View
        style={[
          styles.fadingContainer,
          {
            opacity: fadeAnim,
            backgroundColor: getTypeColor(props.type),
          },
        ]}
      >
        <Text style={styles.fadingText}>{props.message}</Text>
      </Animated.View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  fadingContainer: {
    padding: 20,
    position: 'absolute',
    top: 20,
    left: 0,
    width: '100%',
  },
  fadingText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
  },
});
