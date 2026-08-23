import { describe, it, expect } from 'vitest'
import { handler } from '../../src/handlers/health.js'
import type { LambdaEvent } from '../../src/types/index.js'

describe('Health Handler', () => {
  it('should return 200 with healthy status', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      requestContext: {},
    } as LambdaEvent

    const response = await handler(event)

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.status).toBe('healthy')
    expect(body.service).toBe('mini-onboarding-backend')
  })
})
