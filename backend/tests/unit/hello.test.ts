import { describe, it, expect } from 'vitest'
import { handler } from '../../src/handlers/hello.js'
import type { LambdaEvent } from '../../src/types/index.js'

describe('Hello Handler', () => {
  it('should return 200 with hello message', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/hello',
      headers: {},
      requestContext: {},
    } as LambdaEvent

    const response = await handler(event)

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.message).toBe('Hello World from Mini Onboarding API')
  })
})
