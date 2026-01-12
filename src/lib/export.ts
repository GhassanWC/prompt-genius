// Export utilities for projects

import type { Project, Prompt } from './projects';

/**
 * Export project and prompts to Markdown format
 */
export function exportToMarkdown(project: Project, prompts: Prompt[]): string {
  let markdown = `# ${project.name}\n\n`;
  
  if (project.idea) {
    markdown += `## Project Idea\n\n${project.idea}\n\n`;
  }
  
  if (project.aiRole) {
    markdown += `## AI Role\n\n${project.aiRole}\n\n`;
  }
  
  if (project.tags && project.tags.length > 0) {
    markdown += `## Tags\n\n${project.tags.map(tag => `\`${tag}\``).join(' ')}\n\n`;
  }
  
  if (prompts.length > 0) {
    markdown += `## Development Plan\n\n`;
    
    prompts.forEach((prompt, index) => {
      markdown += `### ${index + 1}. ${prompt.title}\n\n`;
      
      if (prompt.mapFlow) {
        markdown += `**Context:** ${prompt.mapFlow}\n\n`;
      }
      
      markdown += `**Prompt:**\n${prompt.userPrompt}\n\n`;
      
      if (prompt.acceptanceCriteria && prompt.acceptanceCriteria.length > 0) {
        markdown += `**Acceptance Criteria:**\n`;
        prompt.acceptanceCriteria.forEach(criterion => {
          markdown += `- ${criterion}\n`;
        });
        markdown += `\n`;
      }
      
      if (prompt.isDone) {
        markdown += `✅ **Completed**\n\n`;
      }
      
      markdown += `---\n\n`;
    });
  }
  
  markdown += `\n*Exported from Prompt Genius AI*\n`;
  
  return markdown;
}

/**
 * Create a downloadable blob URL for markdown content
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create a downloadable blob URL for plain text content
 */
export function downloadText(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}





















