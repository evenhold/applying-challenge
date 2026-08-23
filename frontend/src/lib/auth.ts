export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  sub: string;
  email: string;
  username: string;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  return {
    accessToken: data.AuthenticationResult.AccessToken,
    idToken: data.AuthenticationResult.IdToken,
    refreshToken: data.AuthenticationResult.RefreshToken,
    expiresIn: data.AuthenticationResult.ExpiresIn,
  };
}

export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  return {
    accessToken: data.AuthenticationResult.AccessToken,
    idToken: data.AuthenticationResult.IdToken,
    refreshToken: data.AuthenticationResult.RefreshToken,
    expiresIn: data.AuthenticationResult.ExpiresIn,
  };
}

export function parseJwtPayload(token: string): AuthUser | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(''),
    );
    const payload = JSON.parse(jsonPayload);
    return {
      sub: payload.sub,
      email: payload.email,
      username: payload['cognito:username'],
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
