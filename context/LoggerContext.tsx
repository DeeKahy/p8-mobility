import React, { createContext, useContext, useEffect, useState } from 'react';

import { logger, LogEntry } from '../tools/logger';
/**
 * This context is responsible for storing all logs created by the global logger.
 * It is techinicly meant for storing global default values but can be used to store everything.
 * * https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/
 * The LoggerProvider subscribes to the logger and listens for new log entries.
 * logger.ts  ---> emits logs
 * LoggerContext ---> listens and stores logs
 * Debug screen ---> reads logs and displays them
 *
 * Whenever a log is emitted, it updates the logs state.
 *
 * Components inside the app can access the logs using the useLogger() hook.
 */
interface LoggerContextType {
  logs: LogEntry[];
  clearLogs: () => void;
}
// Default values for our LogEntry object.
const LoggerContext = createContext<LoggerContextType>({
  logs: [],
  clearLogs: () => {},
});
// This is our Wrapper we create
export const LoggerProvider = ({ children }: any) => {
  // Our Semi Global state that holds all logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    logger.subscribe((log) => {
      // Callback function we call
      setLogs((prev) => [log, ...prev]); // Updates log when event
    });
  }, []); // Tells react only to Run this once.

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <LoggerContext.Provider value={{ logs, clearLogs }}>
      {children}
    </LoggerContext.Provider>
  );
};

export const useLogger = () => useContext(LoggerContext);
