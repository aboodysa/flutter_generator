import * as fs from 'fs';
import * as path from 'path';
import {
  GenerationConfig,
  GenerationContext,
  GenerationArtifacts,
  Manifest,
  ProductSpec,
  UiSpec,
} from './types';

const DEFAULT_ARTIFACTS: GenerationArtifacts = {
  ui: false,
  router: false,
  models: false,
  repositories: false,
  bloc: false,
  usecases: false,
  di: false,
  tests: false,
};

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function defaultConfig(): GenerationConfig {
  return {
    artifacts: {
      ...DEFAULT_ARTIFACTS,
      ui: true,
      router: true,
    },
    stateManagement: 'none',
    outputDir: 'lib',
  };
}

function applyArtifactList(artifacts: GenerationArtifacts, list: string[] | null): GenerationArtifacts {
  if (!list || list.length === 0) return artifacts;
  const next: GenerationArtifacts = { ...DEFAULT_ARTIFACTS };
  for (const key of list) {
    if (key in next) {
      next[key as keyof GenerationArtifacts] = true;
    }
  }
  return next;
}

export function loadGenerationConfig(argv: string[] = process.argv): GenerationConfig {
  const configPathCandidates = [
    path.resolve(process.cwd(), 'specs', 'generation.config.json'),
    path.resolve(process.cwd(), 'fahs.config.json'),
  ];

  let config = defaultConfig();
  for (const candidate of configPathCandidates) {
    if (fs.existsSync(candidate)) {
      const loaded = loadJson<Partial<GenerationConfig>>(candidate);
      config = {
        ...config,
        ...loaded,
        artifacts: {
          ...config.artifacts,
          ...(loaded.artifacts || {}),
        },
      };
      break;
    }
  }

  const artifactsFlagIndex = argv.indexOf('--artifacts');
  if (artifactsFlagIndex !== -1 && argv.length > artifactsFlagIndex + 1) {
    const requested = argv[artifactsFlagIndex + 1]
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    config.artifacts = applyArtifactList(config.artifacts, requested);
  }

  const stateMgmtIndex = argv.indexOf('--state-mgmt');
  if (stateMgmtIndex !== -1 && argv.length > stateMgmtIndex + 1) {
    const value = argv[stateMgmtIndex + 1] as GenerationConfig['stateManagement'];
    config.stateManagement = value;
  }

  const outputDirIndex = argv.indexOf('--output-dir');
  if (outputDirIndex !== -1 && argv.length > outputDirIndex + 1) {
    config.outputDir = argv[outputDirIndex + 1];
  }

  return config;
}

export function buildGenerationContext(config: GenerationConfig): GenerationContext {
  const specDir = path.resolve(process.cwd(), 'specs');
  const manifestPath = path.join(specDir, 'manifest.json');
  const componentMapPath = path.join(specDir, 'bindings', 'flutter', 'component-map.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  if (!fs.existsSync(componentMapPath)) {
    throw new Error(`Component map not found: ${componentMapPath}`);
  }

  const manifest = loadJson<Manifest>(manifestPath);
  const componentMapData = loadJson<{ componentMap: Record<string, string> }>(componentMapPath);

  const productSpecsByScreenId: Record<string, ProductSpec> = {};
  const uiSpecsByScreenId: Record<string, UiSpec> = {};

  for (const screen of manifest.screens) {
    const productPath = path.resolve(process.cwd(), screen.specs.product);
    const uiPath = path.resolve(process.cwd(), screen.specs.ui);
    if (fs.existsSync(productPath)) {
      productSpecsByScreenId[screen.screenId] = loadJson<ProductSpec>(productPath);
    }
    if (fs.existsSync(uiPath)) {
      uiSpecsByScreenId[screen.screenId] = loadJson<UiSpec>(uiPath);
    }
  }

  return {
    config,
    manifest,
    screens: manifest.screens,
    componentMap: componentMapData.componentMap || {},
    productSpecsByScreenId,
    uiSpecsByScreenId,
    outputRoot: path.resolve(process.cwd(), config.outputDir || 'lib'),
    specDir,
  };
}
