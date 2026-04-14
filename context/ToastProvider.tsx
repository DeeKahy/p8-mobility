import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { View } from "react-native";

import { Toast } from "../components/Toast";

type ToastMessage = {
  id: number;
  message: string;
  type: "Success" | "Error" | "Info";
};

type ToastContextProps = {
  showToast: (message: string, type: "Success" | "Error" | "Info") => void;
};

const ToastContext = createContext<ToastContextProps | null>(null);

interface ToastProviderprops {
  children: ReactNode;
  duration?: number;
}

export const ToastProvider: FC<ToastProviderprops> = ({
  children,
  duration = 1000,
}) => {
  const [toast, setToast] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: "Success" | "Error" | "Info") => {
      const id = Date.now();
      setToast((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = (id: number) => {
    setToast((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View
        style={{
          zIndex: 9999,
          position: "absolute",
          elevation: 9999,
          top: 0,
          left: 0,
          right: 0,
        }}
      >
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
