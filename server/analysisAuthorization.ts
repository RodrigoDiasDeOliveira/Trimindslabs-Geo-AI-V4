export interface AnalysisAccessUser {
  username?: unknown;
  role?: unknown;
}

export interface AnalysisAccessJob {
  ownerUsername?: string;
}

export function canAccessAnalysisJob(
  user: AnalysisAccessUser | null | undefined,
  job: AnalysisAccessJob,
  authenticationEnabled: boolean
): boolean {
  if (!authenticationEnabled) return true;

  if (!user || typeof user.username !== 'string' || !user.username.trim()) {
    return false;
  }

  if (user.role === 'admin') return true;

  if (user.role !== 'operator' && user.role !== 'operador') {
    return false;
  }

  return (
    typeof job.ownerUsername === 'string' &&
    job.ownerUsername === user.username
  );
}
