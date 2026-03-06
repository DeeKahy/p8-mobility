export type LogLevel = 'info' | 'error' | 'debug';
/**
 * This logger is used to create debug logs that can be viewed in the
 * Debug screen inside the application.
 *
 * The logger works by emitting log events to subscribed listeners. 
 * This means that we are using EVENTS witch are global :D, Bascily what we did in c#
 * The LoggerContext subscribes to these events and stores them in React state,
 * which then allows the Debug screen to display them.
 */
export interface LogEntry {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: number;
  group: string;
}

type Listener = (log: LogEntry) => void;

class Logger {
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
  }

  private emit(log: LogEntry) {
    this.listeners.forEach((l) => l(log));
  }
// Default loggers that will always be there. Very usefull 
  log(message: string, group = 'default') {
    this.emit({
      id: Date.now().toString(),
      message,
      level: 'info',
      timestamp: Date.now(),
      group,
    });
  }

  error(message: string, group = 'errors') {
    this.emit({
      id: Date.now().toString(),
      message,
      level: 'error',
      timestamp: Date.now(),
      group,
    });
  }

  debug(message: string, group = 'debug') {
    this.emit({
      id: Date.now().toString(),
      message,
      level: 'debug',
      timestamp: Date.now(),
      group,
    });
  }
}

export const logger = new Logger();