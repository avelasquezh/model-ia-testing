export type BrowserAutomationSession = {
  navigate(url: string, timeoutMs: number): Promise<void>;
  close(): Promise<void>;
};

export interface BrowserAutomationPort {
  open(): Promise<BrowserAutomationSession>;
}
