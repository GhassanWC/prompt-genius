// Feature limits based on subscription tiers
export const FEATURE_LIMITS: Record<string, number> = {
  free: 8,
  plus: 16,
  pro: 32,
};

export const getFeatureLimit = (tierId: string | null): number => {
  if (!tierId) return FEATURE_LIMITS.free;
  return FEATURE_LIMITS[tierId] || FEATURE_LIMITS.free;
};

