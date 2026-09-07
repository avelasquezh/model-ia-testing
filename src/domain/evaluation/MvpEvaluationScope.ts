import type { Criterion } from './Criterion.js';

export const MVP_CORE_CRITERION_IDS = [
  'D1-C01',
  'D1-C02',
  'D1-C03',
  'D1-C04',
  'D2-C01',
  'D2-C02',
  'D2-C04',
  'D2-C05',
  'D3-C01',
  'D3-C02',
  'D3-C03',
  'D3-C04',
  'D4-C01',
  'D4-C03',
  'D4-C04',
  'D6-C01',
  'D6-C03',
  'D6-C04',
] as const;

export type MvpCoreCriterionId = (typeof MVP_CORE_CRITERION_IDS)[number];

const MVP_CORE_CRITERION_SET = new Set<string>(MVP_CORE_CRITERION_IDS);

export function isMvpCoreCriterion(criterion: Criterion): criterion is Criterion & {
  readonly props: Criterion['props'] & { readonly id: MvpCoreCriterionId };
} {
  return MVP_CORE_CRITERION_SET.has(criterion.props.id);
}
