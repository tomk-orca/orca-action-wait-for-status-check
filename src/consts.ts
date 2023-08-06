// eslint-disable-next-line no-shadow
export enum ChecksStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// eslint-disable-next-line no-shadow,@typescript-eslint/no-unused-vars
enum ChecksConclusion {
  ACTION_REQUIRED = 'action_required',
  CANCELLED = 'cancelled',
  FAILURE = 'failure',
  NEUTRAL = 'neutral',
  SUCCESS = 'success',
  SKIPPED = 'skipped',
  STALE = 'stale',
  TIMED_OUT = 'timed_out'
}
