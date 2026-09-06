export interface BrowserPort {
  open(targetUrl: string): Promise<void>;
  sendMessage(message: string): Promise<string>;
  close(): Promise<void>;
}
