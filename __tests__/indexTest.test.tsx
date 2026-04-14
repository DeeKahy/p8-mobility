import { render } from "@testing-library/react-native";

import Main from "../app/(tabs)/main";
import { LoggerProvider } from "../context/LoggerContext";
import { ToastProvider } from "../context/ToastProvider";

describe("<Main />", () => {
  test("Text renders correctly on index screen", () => {
    const { getByText } = render(
      <ToastProvider>
        <LoggerProvider>
          <Main />
        </LoggerProvider>
      </ToastProvider>
    );
    getByText("Welcome to our very Hygge App");
  });
});
