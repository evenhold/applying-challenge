const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1';
const COGNITO_USER_POOL_ID = (() => {
  const url = process.env.NEXT_PUBLIC_COGNITO_URL || '';
  const match = url.match(/\/([\w-]+_[\w-]+)$/);
  return match ? match[1] : '';
})();
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

const COGNITO_ENDPOINT = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

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

async function cognitoRequest(target: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': target,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Cognito request failed');
  }

  return data;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const data = await cognitoRequest(
    'AWSCognitoIdentityProviderService.InitiateAuth',
    {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    },
  );

  const result = data.AuthenticationResult as Record<string, string>;
  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    expiresIn: Number(result.ExpiresIn),
  };
}

export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  const data = await cognitoRequest(
    'AWSCognitoIdentityProviderService.InitiateAuth',
    {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    },
  );

  const result = data.AuthenticationResult as Record<string, string>;
  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    expiresIn: Number(result.ExpiresIn),
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
