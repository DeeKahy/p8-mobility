import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // overlay effect
    justifyContent: 'space-between',
    paddingVertical: 40,
  },

  svgContainer: {
    margin: 100,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    elevation: 3,
  },

  buttonText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '600',
  },
});
