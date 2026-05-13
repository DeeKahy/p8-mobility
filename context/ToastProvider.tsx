import React, {
  createContext,
  FC,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

import { Toast } from "../components/Toast";

type ToastMessage = {
  id: number;
  message: string;
  type: "Success" | "Error" | "Info";
};

type ToastContextProps = {
  showToast: (message: string, type: "Success" | "Error" | "Info") => void;
  register: (overlay: ReactElement) => number;
  unregister: (id: number) => void;
};

const ToastContext = createContext<ToastContextProps | null>(null);

interface ToastProviderprops {
  children: React.ReactNode;
}

export const ToastProvider: FC<ToastProviderprops> = ({ children }) => {
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
    { id: number; overlay: ReactElement }[]
  >([]);

  const register = useCallback((overlay: ReactElement) => {
    const id = ++idRef.current;
    setOverlays((prev) => [...prev, { id, overlay }]);
    return id;
  }, []);

  const unregister = useCallback((id: number) => {
    setOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, register, unregister }}>
      {children}
      {overlays.map(({ id, overlay }) => (
        <View
          key={id}
          style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}
        >
          {overlay}
        </View>
      ))}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
        {toast.map((item) => (
          <Toast
            key={item.id}
            message={item.message}
            type={item.type}
            onRemove={() => removeToast(item.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface OverlayProps {
  children: ReactElement;
}

// Wraps a component and moves it to the overlay modal on mount.
// This moves it to a modal-like layer removed from the normal layout.
// Real modal components still render above this layer.
export const Overlay = ({ children }: OverlayProps) => {
  const idRef = useRef<number>(null);
  const { register, unregister } = useToast();

  useEffect(() => {
    idRef.current = register(children);
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
