export type LogContext = Record<string, string | number | boolean>;

export class StructuredLogger {
  public info(message: string, context: LogContext = {}): void {
    process.stdout.write(`${JSON.stringify({ level: 'info', message, ...context })}\n`);
  }
}
