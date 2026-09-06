import type { ConversationPort } from '../../application/ports/ConversationPort.js';
import { LiveExecutionEvidencePublisher } from './LiveExecutionEvidencePublisher.js';
import { PlaywrightExecutionRunner } from './PlaywrightExecutionRunner.js';

export function createPlaywrightExecutionRunner(
  conversation: ConversationPort,
  rootDirectory = 'test-results/evidence',
): PlaywrightExecutionRunner {
  return new PlaywrightExecutionRunner(
    conversation,
    new LiveExecutionEvidencePublisher(rootDirectory),
  );
}
