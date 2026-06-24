import { buildGenerationContext, loadGenerationConfig } from './core/context';
import { GenerationPipeline } from './core/pipeline';
import { UIGenerator } from './generators/ui.generator';

async function main() {
  const config = loadGenerationConfig(process.argv);
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
  pipeline.register(new UIGenerator());
  await pipeline.run(context);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
