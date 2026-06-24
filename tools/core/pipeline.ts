import { GenerationContext, Generator } from './types';

export class GenerationPipeline {
  private generators: Map<string, Generator> = new Map();

  register(generator: Generator): void {
    this.generators.set(generator.name, generator);
  }

  async run(context: GenerationContext): Promise<void> {
    const enabledArtifacts = Object.entries(context.config.artifacts)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);

    console.log(`🚀 Generation pipeline started`);
    console.log(`   Enabled artifacts: ${enabledArtifacts.join(', ') || '(none)'}`);

    const artifactEntries = Object.entries(context.config.artifacts);
    for (const [artifactName, enabled] of artifactEntries) {
      if (!enabled) continue;
      const generator = this.generators.get(artifactName);
      if (!generator) {
        throw new Error(`No generator registered for enabled artifact: ${artifactName}`);
      }
      console.log(`▶️  Running generator: ${generator.name}`);
      await generator.generate(context);
      console.log(`✅ Finished generator: ${generator.name}`);
    }

    console.log(`🏁 Generation pipeline complete`);
  }
}
