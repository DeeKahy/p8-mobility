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

type OverlayItem = { id: number; node: React.ReactNode };

type OverlayContextProps = {
  showToast: (message: string, type: "Success" | "Error" | "Info") => void;
  register: (node: React.ReactNode) => number;
  unregister: (id: number) => void;
  update: (id: number, node: React.ReactNode) => void;
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

  const [overlays, setOverlays] = useState<OverlayItem[]>([]);

  const register = useCallback((node: React.ReactNode) => {
    const id = ++idRef.current;
    setOverlays((prev) => [...prev, { id, node }]);
    return id;
  }, []);

  const unregister = useCallback((id: number) => {
    setOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  }, []);

  const update = useCallback((id: number, node: React.ReactNode) => {
    setOverlays((prev) =>
      prev.map((overlay) => {
        if (overlay.id === id) {
          return { id, node };
        } else return overlay;
      })
    );
  }, []);

  return (
    <OverlayContext.Provider
      value={{ showToast, register, unregister, update }}
    >
      <View style={StyleSheet.absoluteFill}>{children}</View>
      {overlays.map(({ id, node }) => (
        <React.Fragment key={id}>{node}</React.Fragment>
      ))}
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
type OverlayProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  animationType?: OverlayAnimationType;
  dependencies?: React.DependencyList;
}>;

const getAnimationSet = (animationType: OverlayAnimationType) => {
  return { entering: undefined, exiting: undefined };
  /*
  switch (animationType) {
    case "none":
      return { entering: undefined, exiting: undefined };
    case "slide":
      return { entering: SlideInDown, exiting: SlideOutDown };
    case "fade":
      return { entering: FadeIn, exiting: FadeOut };
  }
  */
};

// Wraps a ReactNode and moves it to the overlay modal on mount.
// This moves it to a modal-like layer removed from the normal layout.
// Real modal components still render above this layer.
export const Overlay = ({
  children,
  style,
  animationType = "none",
  dependencies = [],
}: OverlayProps) => {
  const idRef = useRef<number>(null);
  const mounted = useRef(false);
  const { register, unregister, update } = useOverlays();

  const component = (
    <Animated.View
      style={[style, { position: "absolute" }]}
      {...getAnimationSet(animationType)}
    >
      {children}
    </Animated.View>
  );

  useEffect(() => {
    idRef.current = register(component);
    console.log(`Registered overlay ${idRef.current}`);

    return () => {
      if (idRef.current != null) {
        console.log(`Unregistered overlay ${idRef.current}`);
        unregister(idRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mounted.current) {
      // TODO: Update React version and make this a useEffectEvent-callback instead of using mounted.current.
      // See https://stackoverflow.com/questions/55724642/react-useeffect-hook-when-only-one-of-the-effects-deps-changes-but-not-the-oth
      if (idRef.current != null) update(idRef.current, component);
      console.log(`Updated overlay ${idRef.current}`);
    } else {
      mounted.current = true;
    }
  }, dependencies);

  return null;
};
