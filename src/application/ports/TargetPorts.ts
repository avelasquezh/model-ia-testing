export interface IdGenerator {
  generate(): string;
}

export interface TargetAvailabilityPort {
  isAvailable(url: string): Promise<boolean>;
}
