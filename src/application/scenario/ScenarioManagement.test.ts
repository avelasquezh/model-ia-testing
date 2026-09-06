import { describe, expect, it } from 'vitest';
import { Scenario } from '../../domain/scenario/Scenario.js';
import { CreateScenario } from './CreateScenario.js';
import { InMemoryScenarioRepository } from '../../infrastructure/persistence/InMemoryScenarioRepository.js';

const ids = { generate: () => 'scenario-001' };

const validInput = {
  targetId: 'target-001',
  name: 'Saludo inicial',
  objective: 'Validar que el bot salude correctamente',
  description: 'Escenario conversacional básico de bienvenida',
  inputs: [{ value: 'Hola' }, { value: '¿Cómo estás?' }],
  expectedBehavior: 'El bot responde de forma coherente y mantiene el contexto.',
  finishConditions: [{ description: 'Se recibe una respuesta al segundo turno.' }],
};

describe('Scenario management', () => {
  it('creates a version 1 scenario with multiple conversational turns', async () => {
    const repository = new InMemoryScenarioRepository();
    const useCase = new CreateScenario(repository, ids);

    const scenario = await useCase.execute(validInput);

    expect(scenario.props).toEqual({ id: 'scenario-001', version: 1, ...validInput });
    expect(scenario.props.inputs).toHaveLength(2);
  });

  it('rejects a scenario without conversational inputs', () => {
    expect(() => new Scenario({
      ...validInput,
      id: 'scenario-001',
      version: 1,
      inputs: [],
    })).toThrow('Scenario must contain at least one input');
  });

  it('creates the next scenario version explicitly', () => {
    const scenario = new Scenario({ id: 'scenario-001', version: 1, ...validInput });

    const version2 = scenario.nextVersion({
      ...validInput,
      expectedBehavior: 'El bot responde y conserva el contexto entre turnos.',
    });

    expect(version2.props.id).toBe('scenario-001');
    expect(version2.props.version).toBe(2);
    expect(version2.props.expectedBehavior).toContain('conserva el contexto');
  });

  it('keeps scenarios queryable by target', async () => {
    const repository = new InMemoryScenarioRepository();
    const useCase = new CreateScenario(repository, ids);
    await useCase.execute(validInput);

    const scenarios = await repository.findAllByTargetId('target-001');

    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]?.props.id).toBe('scenario-001');
  });
});
