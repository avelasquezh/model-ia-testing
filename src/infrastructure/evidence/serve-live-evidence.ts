import { LiveExecutionEvidenceViewer } from './LiveExecutionEvidenceViewer.js';

const [rootDirectory = 'test-results/evidence', executionId] = process.argv.slice(2);

if (!executionId) {
  console.error('Usage: npm run evidence:viewer -- <execution-id> [root-directory]');
  process.exitCode = 1;
} else {
  const viewer = new LiveExecutionEvidenceViewer(rootDirectory, '127.0.0.1', 0);
  const server = await viewer.start();
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine viewer address');
  }

  console.log(`Live evidence viewer: http://${address.address}:${address.port}/execution/${encodeURIComponent(executionId)}`);

  const shutdown = () => {
    server.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
