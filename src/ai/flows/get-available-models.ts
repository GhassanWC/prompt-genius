'use server';

/**
 * @fileOverview Gets the list of AI models that are actually available
 * based on the configured API keys.
 */
import { ai } from '@/ai/genkit';
import { allAvailableModels, type ModelDefinition } from '@/ai/models';

export async function getAvailableModels(): Promise<ModelDefinition[]> {
  try {
    const loadedModels = await ai.listModels();
    const loadedModelIds = new Set(loadedModels);
    return allAvailableModels.filter((m) => loadedModelIds.has(m.id));
  } catch (error) {
    console.error("Failed to list available models:", error);
    return [];
  }
}
