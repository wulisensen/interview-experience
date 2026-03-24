
export interface ComponentConfig {
  type: string;
  props?: Record<string, any>;
  dynamicProps?: string; // JavaScript code to compute props
  children?: ComponentConfig[];
}

export interface StepConfig {
  id: string;
  title: string;
  components: ComponentConfig[];
}

export interface OrchestrationConfig {
  steps: StepConfig[];
}
