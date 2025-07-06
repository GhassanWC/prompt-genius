import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [googleAI()];

export const ai = genkit({
  plugins,
  // The model will be specified dynamically in each call, so we remove the default here.
});


// Define a list of available text models for the UI
export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
}

export const availableModels: ModelDefinition[] = [
    { id: 'googleai/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google AI' },
];
