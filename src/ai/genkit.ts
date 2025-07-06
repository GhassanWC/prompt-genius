'use server';

import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [googleAI()];

export const ai = genkit({
  plugins,
  // The model will be specified dynamically in each call, so we remove the default here.
});
