import { buildGenerationContext, loadGenerationConfig } from '../tools/core/context';
import { GenerationPipeline } from '../tools/core/pipeline';
import { Generator } from '../tools/core/types';

describe('Generation Pipeline', () => {
  test('defaults to ui and router artifacts', () => {
    const config = loadGenerationConfig(['node', 'tools/run_pipeline.ts']);
    expect(config.artifacts.ui).toBe(true);
    expect(config.artifacts.router).toBe(true);
    expect(config.artifacts.bloc).toBe(false);
  });

  test('respects the artifacts CLI flag', () => {
    const config = loadGenerationConfig([
      'node',
      'tools/run_pipeline.ts',
      '--artifacts',
      'ui',
    ]);
    expect(config.artifacts.ui).toBe(true);
    expect(config.artifacts.router).toBe(false);
  });

  test('fails when an enabled generator is not registered', async () => {
    const config = loadGenerationConfig(['node', 'tools/run_pipeline.ts']);
    config.artifacts = {
      ui: true,
      router: false,
      models: false,
      repositories: false,
      bloc: false,
      usecases: false,
      di: false,
      tests: false,
    };

    const context = buildGenerationContext(config);
    const pipeline = new GenerationPipeline();
    const noopGenerator: Generator = {
      name: 'router',
      async generate() {},
    };
    pipeline.register(noopGenerator);

    await expect(pipeline.run(context)).rejects.toThrow(
      'No generator registered for enabled artifact: ui',
    );
  });
});
