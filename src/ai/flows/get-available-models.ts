'use server';

/**
 * @fileOverview Gets the list of AI models that are actually available
 * based on the configured API keys.
 */
import { allAvailableModels, type ModelDefinition } from '@/ai/models';

// This function now returns the full list of models defined in the app.
// The root layout (`src/app/layout.tsx`) is responsible for checking if the
// necessary API keys are configured before rendering the application.
export async function getAvailableModels(): Promise<ModelDefinition[]> {
  try {
    // We simply return the list of all models defined in `src/ai/models.ts`.
    // The check for API keys happens at the application entry point, so this is safe.
    return allAvailableModels;
  } catch (error) {
    // This catch block is kept as a safeguard.
    console.error("Failed to get available models:", error);
    return [];
  }
}
