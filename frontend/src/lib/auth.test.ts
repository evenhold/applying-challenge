import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, parseJwtPayload, isTokenExpired } from '../../src/lib/auth';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Auth Service', () => {
  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const mockResponse = {
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
          ExpiresIn: 3600,
        },
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }));

      const tokens = await login('seller@test.com', 'Seller123!');

      expect(tokens.accessToken).toBe('mock-access-token');
      expect(tokens.idToken).toBe('mock-id-token');
      expect(tokens.refreshToken).toBe('mock-refresh-token');
      expect(tokens.expiresIn).toBe(3600);
      expect(fetch).toHaveBeenCalledWith('/api/auth', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    it('should throw error on failed login', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      }));

      await expect(login('wrong@test.com', 'bad')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('parseJwtPayload', () => {
    it('should decode a valid JWT payload', () => {
      const payload = { sub: 'user-123', email: 'test@test.com', 'cognito:username': 'testuser' };
      const base64 = btoa(JSON.stringify(payload));
      const token = `header.${base64}.signature`;

      const user = parseJwtPayload(token);

      expect(user).toEqual({
        sub: 'user-123',
        email: 'test@test.com',
        username: 'testuser',
      });
    });

    it('should return null for invalid token', () => {
      expect(parseJwtPayload('invalid')).toBeNull();
    });

    it('should return null for malformed token', () => {
      expect(parseJwtPayload('header.signature')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureExp };
      const base64 = btoa(JSON.stringify(payload));
      const token = `header.${base64}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const payload = { exp: pastExp };
      const base64 = btoa(JSON.stringify(payload));
      const token = `header.${base64}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid')).toBe(true);
    });
  });
});
