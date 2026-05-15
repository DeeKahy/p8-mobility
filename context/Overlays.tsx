import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

import { Toast } from "../components/Toast";

type ToastMessage = {
  id: number;
  message: string;
  type: "Success" | "Error" | "Info";
};

type OverlayContextProps = {
  showToast: (message: string, type: "Success" | "Error" | "Info") => void;
  register: (
    overlay: React.ReactElement<{ style?: StyleProp<ViewStyle> }>
  ) => number;
  unregister: (id: number) => void;
};

const OverlayContext = createContext<OverlayContextProps | null>(null);

interface OverlayProviderProps {
  children: React.ReactNode;
}

export const OverlayProvider: FC<OverlayProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage[]>([]);

  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: "Success" | "Error" | "Info") => {
      const id = ++idRef.current;
      setToast((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = (id: number) => {
    setToast((prev) => prev.filter((toast) => toast.id !== id));
  };

  const [overlays, setOverlays] = useState<
    { id: number; component: React.ReactNode }[]
  >([]);

  const register = useCallback(
    (component: React.ReactElement<{ style?: StyleProp<ViewStyle> }>) => {
      const id = ++idRef.current;
      // Existing elements are immutable so we clone to set the positioning and key
      const style = component.props.style;
      component = React.cloneElement(component, {
        style: [style, { position: "absolute" }],
        key: id,
      });
      setOverlays((prev) => [...prev, { id, component }]);
      return id;
    },
    []
  );

  const unregister = useCallback((id: number) => {
    setOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  }, []);

  return (
    <OverlayContext.Provider value={{ showToast, register, unregister }}>
      <View style={StyleSheet.absoluteFill}>{children}</View>
      {overlays.map(({ component }) => component)}
      {toast.map(({ id, message, type }) => (
        <Toast
          key={id}
          message={message}
          type={type}
          onRemove={() => removeToast(id)}
        />
      ))}
    </OverlayContext.Provider>
  );
};

export const useOverlays = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlays must be used within a ToastProvider");
  }
  return context;
};

type OverlayAnimationType = "none" | "slide" | "fade";
type OverlayProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  animationType?: OverlayAnimationType;
};

const getAnimationSet = (animationType: OverlayAnimationType) => {
  switch (animationType) {
    case "none":
      return { entering: undefined, exiting: undefined };
    case "slide":
      return { entering: SlideInDown, exiting: SlideOutDown };
    case "fade":
      return { entering: FadeIn, exiting: FadeOut };
  }
};

// Wraps a component and moves it to the overlay modal on mount.
// This moves it to a modal-like layer removed from the normal layout.
// Real modal components still render above this layer.
export const Overlay = ({
  children,
  style,
  animationType = "none",
}: OverlayProps) => {
  const idRef = useRef<number>(null);
  const { register, unregister } = useOverlays();

  useEffect(() => {
    idRef.current = register(
      <Animated.View
        style={[style, { position: "absolute" }]}
        {...getAnimationSet(animationType)}
      >
        {children}
      </Animated.View>
    );
    console.log(`Registered overlay ${idRef.current}`);
    return () => {
      if (idRef.current != null) {
        console.log(`Unregistered overlay ${idRef.current}`);
        unregister(idRef.current);
      }
    };
  }, []);
  return null;
};
