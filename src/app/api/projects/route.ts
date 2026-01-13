export const runtime = 'nodejs';  // <-- add this line
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import {
  getProjectsForUser,
  getProject,
  getPromptsForProject,
  createProjectWithPrompts,
  generateAndSaveProjectImage,
  updateProject,
  updatePrompt,
  updatePromptStatus,
  deletePrompt,
  deleteProject,
  addPrompt,
  updatePromptsOrder,
  updateProjectSettings,
  getPublicProjects,
  getUserSubscriptionPlan,
  getUserSubscriptionPlanUrl,
  findUserByEmail,
  getUsers,
  getPublicProjectsPage,
  cloneProjectForUser,
  getUserProjectCounts,
  getIdeaGenerationLimits,
  incrementIdeaGenerationCount,
} from '@/lib/project-server';
import { getSubscriptionByUserId } from '@/lib/subscription-server';
import { decomposeIdea } from '@/ai/flows/decompose-idea';
import { enhanceAiRole } from '@/ai/flows/enhance-ai-role';
import { enhancePrompt } from '@/ai/flows/enhance-prompt';
import { generatePlanFromFeatures } from '@/ai/flows/generate-plan-from-features';
import { generateIdeas } from '@/ai/flows/generate-ideas';
import { getTier } from '@/lib/tiers-server';
type Json = Record<string, any>;



// If you prefer Node.js runtime explicitly:
// export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}


/**
 * GET /api/projects
 *
 * Supported query shapes:
 * - /api/projects                                -> list current user's projects
 * - /api/projects?projectId=abc                  -> get single project (with access check)
 * - /api/projects?projectId=abc&prompts=true     -> get prompts for a project
 * - /api/projects?public=true&count=12           -> latest public projects (community feed)
 * - /api/projects?subscriptionPlan=true          -> current user’s plan
 * - /api/projects?subscriptionUrl=true          -> current user’s plan
 * - /api/projects?action=findUserByEmail&email=email   -> find user by email (admin only) (not implemented yet)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicFeed = searchParams.get('public') === 'true';
    const projectId = searchParams.get('projectId');
    const wantPrompts = searchParams.get('prompts') === 'true';
    const planOnly = searchParams.get('subscriptionPlan') === 'true';
    const planUrlOnly = searchParams.get('subscriptionUrl') === 'true';
    const action = searchParams.get('action') === 'findUserByEmail';


    if (publicFeed) {
      const count = Number(searchParams.get('count') ?? 12);
      const cursor = searchParams.get('cursor'); // optional
      // Try to get userId if available (optional, won't fail if not authenticated)
      let userId: string | null = null;
      try {
        userId = await getCurrentUserId();
      } catch {
        // User not authenticated, that's fine for public feed
      }
      const page = await getPublicProjectsPage(count, cursor, userId);
      return NextResponse.json(page); // -> { projects, nextCursor }
    }

    const uid = await requireUser();

    if (action) {
      const email = String(searchParams.get('email') ?? '');
      const userToInvite = await findUserByEmail(email);
      return NextResponse.json({ userToInvite });
    }

    if (planOnly) {
      const plan = await getUserSubscriptionPlan(uid);
      return NextResponse.json({ plan });
    }

    if (planUrlOnly) {
      const planUrl = await getUserSubscriptionPlanUrl(uid);
      return NextResponse.json({ planUrl });
    }

    if (projectId) {
      if (wantPrompts) {
        const prompts = await getPromptsForProject(uid, projectId);
        return NextResponse.json({ projectId, prompts });
      }
      const project = await getProject(uid, projectId);
      if (!project) return jsonError("Project not found or you don't have access.", 404);
      return NextResponse.json({ project });
    }

    const projects = await getProjectsForUser(uid);
    return NextResponse.json({ projects });
  } catch (e: any) {
    if (e?.message === '__unauthorized__') return jsonError('Unauthorized', 401);
    return jsonError('Unexpected error', 500);
  }
}
/**
 * POST /api/projects
 *
 * Body actions:
 * - { action: "decomposeIdea", idea }                             -> returns { plan }
 * - { action: "generatePlanFromFeatures", enhancedIdea, aiRole, selectedFeatureIds, allFeatures, customFeatures } -> returns { developmentPlan }
 * - { action: "getFeatureLimit" }                                 -> returns { featureLimit }
 * - { action: "enhanceAiRole", role }                             -> returns { enhancedRole }
 * - { action: "enhancePrompt", prompt }                           -> returns { enhancedPrompt }
 * - { action: "createProject", projectName, plan }                -> returns { projectId }
 * - { action: "addPrompt", projectId, prompt }                    -> returns { promptId }
 * - { action: "generateImage", projectId, idea }
 * - { action: "getUsers", userIds }                               -> returns { ok: true }
 * - { action: "cloneProject", sourceProjectId }                   -> returns { cloneProjectId }
 */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser();
    const body = (await req.json()) as Json;
    const action = body?.action as string;

    switch (action) {
      case 'decomposeIdea': {
        const { idea } = body;
        if (!idea || typeof idea !== 'string') return jsonError('idea is required and must be a string');
        const plan = await decomposeIdea({ idea });
        // Ensure developmentPlan is empty array
        if (!plan.developmentPlan) {
          plan.developmentPlan = [];
        }
        return NextResponse.json({ plan });
      }

      case 'generatePlanFromFeatures': {
        const { enhancedIdea, aiRole, selectedFeatureIds, allFeatures, customFeatures } = body;
        if (!enhancedIdea || !aiRole || !selectedFeatureIds || !allFeatures) {
          return jsonError('enhancedIdea, aiRole, selectedFeatureIds, and allFeatures are required');
        }
        if (!Array.isArray(selectedFeatureIds) || !Array.isArray(allFeatures)) {
          return jsonError('selectedFeatureIds and allFeatures must be arrays');
        }
        const result = await generatePlanFromFeatures({
          enhancedIdea,
          aiRole,
          selectedFeatureIds,
          allFeatures,
          customFeatures: customFeatures || undefined,
        });
        return NextResponse.json({ developmentPlan: result.developmentPlan });
      }

      case 'getFeatureLimit': {
        const userSubscription = await getSubscriptionByUserId(uid);
        const tierId = userSubscription?.tier_id || 'free';
        const tier = await getTier(tierId);
        const featureLimit = tier?.features?.featureLimit ?? 8;
        return NextResponse.json({ featureLimit, tierId });
      }

      case 'enhanceAiRole': {
        const { role } = body;
        if (!role || typeof role !== 'string') return jsonError('role is required and must be a string');
        const result = await enhanceAiRole({ role });
        return NextResponse.json({ enhancedRole: result.enhancedRole });
      }

      case 'enhancePrompt': {
        const { prompt } = body;
        if (!prompt || typeof prompt !== 'string') return jsonError('prompt is required and must be a string');
        const result = await enhancePrompt({ prompt });
        return NextResponse.json({ enhancedPrompt: result.enhancedPrompt });
      }

      case 'createProject': {
        const { projectName, plan, tags } = body;
        
        // Run both queries in parallel - using fast denormalized counters!
        const [userSubscription, userCounts] = await Promise.all([
          getSubscriptionByUserId(uid),
          getUserProjectCounts(uid),
        ]);

        const totalProjects = userCounts.projectCount;
        
        // Get project limit: from subscription if exists, otherwise from free tier
        let projectLimit: number;
        if (userSubscription?.cumulative_quantity) {
          projectLimit = userSubscription.cumulative_quantity;
        } else {
          // No subscription - get free tier's projectLimit from tiers collection
          const { getTier } = await import('@/lib/tiers-server');
          const freeTier = await getTier('free');
          projectLimit = freeTier?.features?.projectLimit ?? 1;
        }

        if (totalProjects >= projectLimit) {
          const tierId = userSubscription?.tier_id || 'free';
          const tierName = tierId === 'free' ? 'Hobbyist' : tierId === 'plus' ? 'Plus' : 'Pro';
          return NextResponse.json(
            { 
              error: `You've reached your project limit (${totalProjects}/${projectLimit} projects) on the ${tierName} plan. Upgrade to create more projects and unlock additional features.`,
              currentCount: totalProjects,
              limit: projectLimit,
              tier: tierId,
              tierName: tierName
            },
            { status: 402 }
          );
        }

        if (!projectName || !plan) return jsonError('projectName and plan are required');
        const projectId = await createProjectWithPrompts(uid, projectName, plan, tags);
        return NextResponse.json({ projectId });
      }

      case 'addPrompt': {
        const { projectId, prompt } = body;
        if (!projectId || !prompt) return jsonError('projectId and prompt are required');
        const promptId = await addPrompt(uid, projectId, prompt);
        return NextResponse.json({ promptId });
      }

      case 'generateImage': {
        const { projectId, idea } = body;
        if (!projectId || !idea) return jsonError('projectId and idea are required');
        await generateAndSaveProjectImage(uid, projectId, idea);
        return NextResponse.json({ ok: true });
      }

      case 'getUsers': {
        const { userIds } = body;
        if (!userIds) return jsonError('userIds are required');
        const userProfiles = await getUsers(userIds);
        return NextResponse.json({ ok: true, userProfiles });
      }

      case 'cloneProject': {
        const { sourceProjectId } = body;
        if (!sourceProjectId) return jsonError('sourceProjectId is required');
        try {
          const cloneProjectId = await cloneProjectForUser(uid, sourceProjectId);
          return NextResponse.json({ cloneProjectId });
        } catch (cloneError: any) {
          // Pass through the actual error message from cloneProjectForUser
          const isLimitError = cloneError?.message?.includes('not available') || 
                              cloneError?.message?.includes('upgrade') || 
                              cloneError?.message?.includes('reached your project limit') ||
                              cloneError?.message?.includes('maximum number of projects');
          const statusCode = isLimitError ? 402 : 400;
          return jsonError(cloneError?.message || 'Failed to clone project.', statusCode);
        }
      }

      case 'generateIdeas': {
        const { context } = body;
        
        // Get idea generation limits for this user
        const limits = await getIdeaGenerationLimits(uid);
        
        // Check if user has remaining generations
        if (limits.remainingGenerations <= 0) {
          return NextResponse.json(
            { 
              error: `You've used all your idea generations (${limits.usedGenerations}/${limits.totalGenerations}) on the ${limits.tier === 'free' ? 'Free' : limits.tier === 'plus' ? 'Plus' : 'Pro'} plan. ${limits.tier === 'free' ? 'Upgrade to Plus or Pro for more idea generations.' : limits.tier === 'plus' ? 'Upgrade to Pro for more generations.' : 'Your limit has been reached.'}`,
              limits,
            },
            { status: 402 }
          );
        }
        
        // Generate ideas with the tier-appropriate count
        const result = await generateIdeas({ 
          context: context || undefined, 
          count: limits.ideasPerRequest,
        });
        
        // Increment the user's generation count
        await incrementIdeaGenerationCount(uid);
        
        // Return ideas with updated limits
        const updatedLimits = {
          ...limits,
          usedGenerations: limits.usedGenerations + 1,
          remainingGenerations: limits.remainingGenerations - 1,
        };
        
        return NextResponse.json({ 
          ideas: result.ideas,
          limits: updatedLimits,
        });
      }

      case 'getIdeaGenerationLimits': {
        const limits = await getIdeaGenerationLimits(uid);
        return NextResponse.json({ limits });
      }

      case 'createProjectFromIdea': {
        // This action takes an idea and automatically creates a full project
        const { ideaTitle, ideaDescription } = body;
        if (!ideaTitle || !ideaDescription) {
          return jsonError('ideaTitle and ideaDescription are required');
        }

        // Check project limit first
        const [userSubscription, userCounts] = await Promise.all([
          getSubscriptionByUserId(uid),
          getUserProjectCounts(uid),
        ]);

        const totalProjects = userCounts.projectCount;
        let projectLimit: number;
        if (userSubscription?.cumulative_quantity) {
          projectLimit = userSubscription.cumulative_quantity;
        } else {
          const freeTier = await getTier('free');
          projectLimit = freeTier?.features?.projectLimit ?? 1;
        }

        if (totalProjects >= projectLimit) {
          const tierId = userSubscription?.tier_id || 'free';
          const tierName = tierId === 'free' ? 'Hobbyist' : tierId === 'plus' ? 'Plus' : 'Pro';
          return NextResponse.json(
            { 
              error: `You've reached your project limit (${totalProjects}/${projectLimit} projects) on the ${tierName} plan. Upgrade to create more projects.`,
              currentCount: totalProjects,
              limit: projectLimit,
              tier: tierId,
              tierName: tierName
            },
            { status: 402 }
          );
        }

        // Step 1: Decompose the idea
        const decomposedPlan = await decomposeIdea({ idea: ideaDescription });

        // Step 2: Auto-select all essential and important features
        const selectedFeatureIds = decomposedPlan.featureCategories
          .filter(f => f.priority === 'essential' || f.priority === 'important')
          .map(f => f.id);

        // If no features selected (shouldn't happen), select all
        if (selectedFeatureIds.length === 0) {
          selectedFeatureIds.push(...decomposedPlan.featureCategories.map(f => f.id));
        }

        // Step 3: Generate the development plan from selected features
        const planResult = await generatePlanFromFeatures({
          enhancedIdea: decomposedPlan.enhancedIdea,
          aiRole: decomposedPlan.aiRole,
          selectedFeatureIds,
          allFeatures: decomposedPlan.featureCategories,
        });

        // Step 4: Create the final plan object
        const finalPlan = {
          ...decomposedPlan,
          developmentPlan: planResult.developmentPlan,
        };

        // Step 5: Create the project
        const projectId = await createProjectWithPrompts(uid, ideaTitle, finalPlan);

        return NextResponse.json({ 
          projectId,
          projectName: ideaTitle,
          promptCount: planResult.developmentPlan.length,
        });
      }

      default:
        return jsonError('Unsupported action for POST', 400);
    }
  } catch (e: any) {
    if (e?.message === '__unauthorized__') return jsonError('Unauthorized', 401);
    console.error('[projects POST] Error:', e?.message || e, e?.stack);
    return jsonError(e?.message || 'Unexpected error', 500);
  }
}

/**
 * PATCH /api/projects
 *
 * Body actions:
 * - { action: "updateProject", projectId, data }                  -> { ok: true }
 * - { action: "updatePrompt", projectId, promptId, data }         -> { ok: true }
 * - { action: "updatePromptStatus", projectId, promptId, isDone } -> { ok: true }
 * - { action: "reorderPrompts", projectId, prompts:[{id,order}]}  -> { ok: true }
 * - { action: "updateSettings", projectId, settings:{roles,isPublic} } -> { ok: true }
 */
export async function PATCH(req: NextRequest) {
  try {
    const uid = await requireUser();
    const body = (await req.json()) as Json;
    const action = body?.action as string;

    switch (action) {
      case 'updateProject': {
        const { projectId, data } = body;
        if (!projectId || !data) return jsonError('projectId and data are required');
        await updateProject(uid, projectId, data);
        return NextResponse.json({ ok: true });
      }
      case 'updateProjectVisibility': {
        const userSubscription = await getSubscriptionByUserId(uid);
        if(userSubscription?.status !== "active") {
          return jsonError('Updating project visibility is available for Plus and Pro plans only. Please upgrade your plan.', 402);
        }

        const { projectId, data } = body;
        if (!projectId || !data) return jsonError('projectId and data are required');
        await updateProject(uid, projectId, data);
        return NextResponse.json({ ok: true });
      }

      case 'updatePrompt': {
        const { projectId, promptId, data } = body;
        if (!projectId || !promptId || !data) return jsonError('projectId, promptId and data are required');
        await updatePrompt(uid, projectId, promptId, data);
        return NextResponse.json({ ok: true });
      }

      case 'updatePromptStatus': {
        const { projectId, promptId, isDone } = body;
        if (!projectId || !promptId || typeof isDone !== 'boolean') {
          return jsonError('projectId, promptId and boolean isDone are required');
        }
        await updatePromptStatus(uid, projectId, promptId, isDone);
        return NextResponse.json({ ok: true });
      }

      case 'reorderPrompts': {
        const { projectId, prompts } = body as { projectId: string; prompts: { id: string; order: number }[] };
        if (!projectId || !Array.isArray(prompts)) return jsonError('projectId and prompts[] are required');
        await updatePromptsOrder(uid, projectId, prompts);
        return NextResponse.json({ ok: true });
      }

      case 'updateSettings': {
        const userSubscription = await getSubscriptionByUserId(uid);
        if(userSubscription?.status !== "active") {
          return jsonError('Updating project public Projects & Sharing are available for Plus and Pro plans only. Please upgrade your plan.', 402);
        }

        const { projectId, settings } = body;
        if (!projectId || !settings) return jsonError('projectId and settings are required');
        await updateProjectSettings(uid, projectId, settings);
        return NextResponse.json({ ok: true });
      }

      default:
        return jsonError('Unsupported action for PATCH', 400);
    }
  } catch (e: any) {
    if (e?.message === '__unauthorized__') return jsonError('Unauthorized', 401);
    return jsonError('Unexpected error', 500);
  }
}

/**
 * DELETE /api/projects
 *
 * Body actions:
 * - { action: "deleteProject", projectId }                        -> { ok: true }
 * - { action: "deletePrompt", projectId, promptId }               -> { ok: true }
 */
export async function DELETE(req: NextRequest) {
  try {
    const uid = await requireUser();
    const body = (await req.json()) as Json;
    const action = body?.action as string;

    switch (action) {
      case 'deleteProject': {
        const { projectId } = body;
        if (!projectId) return jsonError('projectId is required');
        
        // Check if user is on free tier - block deletion for free users
        const userSubscription = await getSubscriptionByUserId(uid);
        const tierId = userSubscription?.tier_id || 'free';
        
        if (tierId === 'free') {
          return jsonError(
            'Project deletion is not available on the free plan. Upgrade to Plus or Pro to delete projects and unlock additional features.',
            402
          );
        }
        
        await deleteProject(uid, projectId);
        return NextResponse.json({ ok: true });
      }

      case 'deletePrompt': {
        const { projectId, promptId } = body;
        if (!projectId || !promptId) return jsonError('projectId and promptId are required');
        await deletePrompt(uid, projectId, promptId);
        return NextResponse.json({ ok: true });
      }

      default:
        return jsonError('Unsupported action for DELETE', 400);
    }
  } catch (e: any) {
    if (e?.message === '__unauthorized__') return jsonError('Unauthorized', 401);
    return jsonError('Unexpected error', 500);
  }
}
