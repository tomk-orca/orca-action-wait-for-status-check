import { GitHub } from '@actions/github/lib/utils'
import { wait } from './wait'
import { ChecksStatus } from './consts'

const NOT_COMPLETED_CHECKS_STATUSES: string[] = [
  ChecksStatus.QUEUED,
  ChecksStatus.IN_PROGRESS
]

export interface Options {
  client: InstanceType<typeof GitHub>
  log: (message: string) => void

  statusName: string
  timeoutSeconds: number
  intervalSeconds: number
  owner: string
  repo: string
  ref: string
  app_slug: string
}

interface app {
  id: number
  slug: string
}
interface CheckRunsStatusValues {
  context?: string
  status?: string | null
  name?: string | null
  app?: app | undefined | null
}

export const poll = async (
  options: Options
): Promise<CheckRunsStatusValues> => {
  const {
    client,
    log,
    statusName,
    timeoutSeconds,
    intervalSeconds,
    owner,
    repo,
    ref,
    app_slug
  } = options

  let now = new Date().getTime()
  const deadline = now + timeoutSeconds * 1000

  while (now <= deadline) {
    log(`Retrieving commit statuses on test:: ${owner}/${repo}@${ref}...`)

    // https://docs.github.com/en/free-pro-team@latest/rest/checks/runs?apiVersion=2022-11-28#list-check-runs-for-a-git-reference
    const {
      data: { total_count, check_runs }
    } = await client.rest.checks.listForRef({
      owner,
      repo,
      ref
    })

    log(`Retrieved ${total_count} commit statuses app name: ${app_slug}`)
    // find the first completed check run with the given name and the app name
    const completedCheckRuns = check_runs.find(
      check_run =>
        check_run.app &&
        check_run.name === statusName &&
        check_run.app.slug === app_slug &&
        !NOT_COMPLETED_CHECKS_STATUSES.includes(check_run.status)
    )
    if (completedCheckRuns) {
      log(
        `Found a completed commit status with id ${completedCheckRuns.id} and conclusion ${completedCheckRuns.conclusion}`
      )
      return {
        context: completedCheckRuns.name,
        status: completedCheckRuns.status,
        name: completedCheckRuns.name,
        app: {
          id: completedCheckRuns.app!.id,
          slug: completedCheckRuns.app!.slug || ''
        }
      }
    }

    log(
      `No completed commit status named ${statusName}, waiting for ${intervalSeconds} seconds...`
    )
    await wait(intervalSeconds * 1000)

    now = new Date().getTime()
  }

  log(
    `No completed commit status named ${statusName} after ${timeoutSeconds} seconds, exiting with conclusion 'timed_out'`
  )
  return {
    status: 'timed_out'
  }
}
