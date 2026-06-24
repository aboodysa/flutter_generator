export interface ScreenSpec {
  screenId: string;
  name: string;
  route: string;
  role: string;
  generatedClass: string;
  specs: { product: string; ui: string };
}

export interface Manifest {
  app: string;
  direction: string;
  initialRoute: string;
  screens: ScreenSpec[];
}

export interface ProductAction {
  id: string;
  label?: string;
  type: string;
  target?: string;
  requiresValidForm?: boolean;
}

export interface ProductSpec {
  id: string;
  actions?: ProductAction[];
  navigation?: { action: string; targetScreenId: string }[];
}

export interface UiComponent {
  type: string;
  variant?: string;
  props?: Record<string, any>;
  children?: UiComponent[];
  regions?: Record<string, UiComponent>;
  action?: string;
  primaryAction?: string;
  bindsTo?: string;
  repeat?: boolean;
  spacing?: string;
  scroll?: boolean | string;
  padding?: string;
}

export interface UiSpec {
  screenId: string;
  usesProductSpec: string;
  layout: {
    type: string;
    safeArea?: boolean;
    scroll?: boolean;
    regions: Record<string, UiComponent>;
  };
}

export interface GenerationArtifacts {
  ui: boolean;
  router: boolean;
  models: boolean;
  repositories: boolean;
  bloc: boolean;
  usecases: boolean;
  di: boolean;
  tests: boolean;
}

export interface GenerationConfig {
  artifacts: GenerationArtifacts;
  stateManagement: 'bloc' | 'cubit' | 'riverpod' | 'provider' | 'none';
  outputDir: string;
}

export interface GenerationContext {
  config: GenerationConfig;
  manifest: Manifest;
  screens: ScreenSpec[];
  componentMap: Record<string, string>;
  productSpecsByScreenId: Record<string, ProductSpec>;
  uiSpecsByScreenId: Record<string, UiSpec>;
  outputRoot: string;
  specDir: string;
}

export interface Generator {
  readonly name: string;
  generate(context: GenerationContext): Promise<void>;
}
