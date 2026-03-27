import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  formCard: {
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 20,
    gap: 15,
  },
  imageContainer: {
    borderColor: "#ccc",
    borderRadius: 20,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    color: "black",
    fontSize: 16,
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    height: 100,
    color: "black",
    textAlignVertical: "top",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#a6f4d6",
    color: "grey",
    borderRadius: 10,
    padding: 8,
    minWidth: 120,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 20,
  },
  error: {
    color: "red",
    marginBottom: 5,
  },
});
