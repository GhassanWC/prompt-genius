// Define a list of available text models for the UI
export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
}

export const availableModels: ModelDefinition[] = [
    { id: 'googleai/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google AI' },
];
