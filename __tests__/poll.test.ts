import { poll } from '../src/poll'
import { jest, expect, test } from '@jest/globals'
import { ChecksStatus } from '../src/consts'
const client = {
  rest: {
    checks: {
      listForRef: jest.fn<ReturnType<any>>()
    }
  }
}

const run = async () =>
  poll({
    client: client as any,
    log: () => {},
    statusName: 'testApp check',
    owner: 'testOrg',
    repo: 'testRepo',
    ref: '123456789abcdefg',
    timeoutSeconds: 3,
    intervalSeconds: 0.1,
    app_slug: 'testApp'
  })

test('Returns details of a matching status check', async () => {
  client.rest.checks.listForRef.mockResolvedValue({
    data: {
      check_runs: [
        {
          status: ChecksStatus.COMPLETED,
          context: 'testApp check',
          name: 'testApp check',
          app: {
            id: 123456,
            slug: 'testApp'
          }
        }
      ]
    }
  })

  const result = await run()

  expect(result).toEqual({
    context: 'testApp check',
    status: ChecksStatus.COMPLETED,
    name: 'testApp check',
    app: {
      id: 123456,
      slug: 'testApp'
    }
  })
  expect(client.rest.checks.listForRef).toHaveBeenCalledWith({
    owner: 'testOrg',
    repo: 'testRepo',
    ref: '123456789abcdefg'
  })
})

test('polls until matching check is found', async () => {
  client.rest.checks.listForRef
    .mockResolvedValueOnce({
      data: {
        check_runs: [
          {
            status: ChecksStatus.IN_PROGRESS,
            context: 'testApp check',
            name: 'testApp check',
            app: {
              id: 123456,
              slug: 'testApp'
            }
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: {
        check_runs: [
          {
            status: ChecksStatus.COMPLETED,
            context: 'testApp check',
            name: 'testApp check',
            app: {
              id: 123456,
              slug: 'testApp'
            }
          }
        ]
      }
    })

  const result = await run()

  expect(result).toEqual({
    status: ChecksStatus.COMPLETED,
    context: 'testApp check',
    name: 'testApp check',
    app: {
      id: 123456,
      slug: 'testApp'
    }
  })
  expect(client.rest.checks.listForRef).toHaveBeenCalledTimes(2)
})

test(`returns a state of 'timed_out' if a matching status check is not found by the timeoutSeconds`, async () => {
  client.rest.checks.listForRef.mockResolvedValue({
    data: {
      check_runs: [
        {
          status: ChecksStatus.IN_PROGRESS,
          context: 'testApp check',
          name: 'testApp check',
          app: {
            id: 123456,
            slug: 'testApp'
          }
        }
      ]
    }
  })

  const result = await run()
  expect(result).toEqual({ status: 'timed_out' })
})
