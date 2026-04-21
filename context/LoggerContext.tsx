import React, { createContext, useContext, useState } from "react";

export type LogLevel = "info" | "error" | "debug";

export interface LogEntry {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: number;
  group: string;
}

interface LoggerContextType {
  logs: LogEntry[];
  log: (message: string, group?: string) => void;
  error: (message: string, group?: string) => void;
  debug: (message: string, group?: string) => void;
  custom: (message: string, group: string, level?: LogLevel) => void;
  clearLogs: () => void;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

let nextLogId = 0;

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, level: LogLevel, group: string) => {
    nextLogId += 1;

    const entry: LogEntry = {
      id: String(nextLogId),
      message,
      level,
      timestamp: Date.now(),
      group,
    };

    const formattedMessage = `[${group}] ${message}`;
    console.log(formattedMessage);

    setLogs((prev) => [entry, ...prev]);
  };
  // Default loggers that will always be there. Very usefull
  const log = (message: string) => {
    addLog(message, "info", "info");
  };

  const error = (message: string) => {
    addLog(message, "error", "error");
  };

  const debug = (message: string) => {
    addLog(message, "debug", "debug");
  };

  const custom = (message: string, group: string, level: LogLevel = "info") => {
    addLog(message, level, group);
  };

  const clearLogs = () => {
    setLogs([]);
  };
  // This is our Wrapper we create// {} is to say that there can be kids
  return (
    <LoggerContext.Provider
      value={{ logs, log, error, debug, custom, clearLogs }}
    >
      {children}
    </LoggerContext.Provider>
  );
}

export function useLogger() {
  const context = useContext(LoggerContext);

  if (!context) {
    throw new Error("useLogger must be used within a LoggerProvider");
  }

  return context;
}
