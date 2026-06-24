import { buildGenerationContext, loadGenerationConfig } from './core/context';
import { GenerationPipeline } from './core/pipeline';
import { RouterGenerator } from './generators/router.generator';
import { UIGenerator } from './generators/ui.generator';

async function main() {
  const config = loadGenerationConfig(process.argv);
  const context = buildGenerationContext(config);
  const pipeline = new GenerationPipeline();
  pipeline.register(new UIGenerator());
  pipeline.register(new RouterGenerator());
  await pipeline.run(context);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
