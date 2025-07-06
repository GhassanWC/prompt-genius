// This file defines all *potentially* available models.
// The actual list of models available to the user is determined at runtime
// by the `getAvailableModels` flow, which checks for configured API keys.

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
}

export const allAvailableModels: ModelDefinition[] = [
    { id: 'googleai/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google AI' },
];
