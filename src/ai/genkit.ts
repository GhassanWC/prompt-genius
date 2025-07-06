import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [];

// Conditionally add plugins only if their API key is available in the environment.
// This allows developers to use only the providers they need without the app crashing.
if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  // The model will be specified dynamically in each call, so we remove the default here.
});
