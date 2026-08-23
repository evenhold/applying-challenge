import { describe, expect, it } from 'vitest';
import { findHandler, getRegisteredRoutes } from './router.js';

describe('findHandler', () => {
  it('should match static routes', () => {
    const match = findHandler('GET', '/health');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({});
  });

  it('should match /hello', () => {
    const match = findHandler('GET', '/hello');
    expect(match).not.toBeNull();
  });

  it('should match POST /merchants', () => {
    const match = findHandler('POST', '/merchants');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({});
  });

  it('should match GET /merchants (list)', () => {
    const match = findHandler('GET', '/merchants');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({});
  });

  it('should match GET /merchants/:id with param', () => {
    const match = findHandler('GET', '/merchants/123');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({ id: '123' });
  });

  it('should match PUT /merchants/:id with param', () => {
    const match = findHandler('PUT', '/merchants/MERCHANT#abc');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({ id: 'MERCHANT#abc' });
  });

  it('should return null for unknown route', () => {
    const match = findHandler('GET', '/unknown');
    expect(match).toBeNull();
  });

  it('should return null for wrong method', () => {
    const match = findHandler('DELETE', '/merchants');
    expect(match).toBeNull();
  });

  it('should return null for DELETE /merchants/:id', () => {
    const match = findHandler('DELETE', '/merchants/123');
    expect(match).toBeNull();
  });

  it('should match /health but not /health/extra', () => {
    expect(findHandler('GET', '/health')).not.toBeNull();
    expect(findHandler('GET', '/health/extra')).toBeNull();
  });
});

describe('getRegisteredRoutes', () => {
  it('should return all registered routes', () => {
    const routes = getRegisteredRoutes();
    expect(routes.length).toBe(6);
    expect(routes).toContainEqual({ method: 'GET', pattern: '/health' });
    expect(routes).toContainEqual({ method: 'GET', pattern: '/hello' });
    expect(routes).toContainEqual({ method: 'POST', pattern: '/merchants' });
    expect(routes).toContainEqual({ method: 'GET', pattern: '/merchants' });
    expect(routes).toContainEqual({ method: 'GET', pattern: '/merchants/:id' });
    expect(routes).toContainEqual({ method: 'PUT', pattern: '/merchants/:id' });
  });
});
