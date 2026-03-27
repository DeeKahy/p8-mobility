import { render } from "@testing-library/react-native";

import Main from "../app/(tabs)/main";
import { LoggerProvider } from "../context/LoggerContext";

describe("<Main />", () => {
  test("Text renders correctly on index screen", () => {
    const { getByText } = render(
      <LoggerProvider>
        <Main />
      </LoggerProvider>
    );
    getByText("Welcome to our very Hygge App");
  });
});
