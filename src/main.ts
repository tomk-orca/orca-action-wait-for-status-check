import * as core from '@actions/core'
import * as github from '@actions/github'
import { poll } from './poll'
import { resolveSha } from './resolve-sha'

async function run(): Promise<void> {
  try {
    const context = github.context

    const token = core.getInput('token', { required: true })

    const {
      context: statusContext,
      status,
      app
    } = await poll({
      client: github.getOctokit(token),
      log: msg => core.info(msg),

      statusName: core.getInput('statusName', { required: true }),
      owner: core.getInput('owner') || context.repo.owner,
      repo: core.getInput('repo') || context.repo.repo,
      ref: core.getInput('ref') || resolveSha(context),

      timeoutSeconds: parseInt(core.getInput('timeoutSeconds') || '600'),
      intervalSeconds: parseInt(core.getInput('intervalSeconds') || '10'),
      app_slug: core.getInput('app') || ''
    })

    if (statusContext) core.setOutput('context', statusContext)
    if (status) core.setOutput('status', status)
    if (app?.id) core.setOutput('app_id', app.id)
    if (app?.slug) core.setOutput('app_name', app.slug)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('Unknown Error')
    }
  }
}

run()
