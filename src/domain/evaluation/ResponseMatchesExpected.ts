export type ResponseMatchInput = {
  readonly expected: string;
  readonly observed: string;
};

export class ResponseMatchesExpected {
  public static evaluate(input: ResponseMatchInput): boolean {
    return input.expected.trim() === input.observed.trim();
  }
}
