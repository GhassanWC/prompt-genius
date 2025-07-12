
import {genkit} from 'genkit';
import {googleAI, type GoogleAIPlugin} from '@genkit-ai/googleai';

// The application's main layout file (src/app/layout.tsx) already ensures
// that the necessary API keys are present in the environment before rendering
// the app. Therefore, we can unconditionally initialize the plugins here,
// making the setup more robust.
const plugins: GoogleAIPlugin[] = [
  googleAI(),
];

export const ai = genkit({
  plugins,
  // The model will be specified dynamically in each call, so we remove the default here.
});
