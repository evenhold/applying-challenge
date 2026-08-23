import { type NextRequest, NextResponse } from 'next/server';

const COGNITO_ENDPOINT = process.env.COGNITO_ENDPOINT || 'http://floci:4566';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

export async function POST(request: NextRequest) {
  try {
    const { email, password, refreshToken: rt } = await request.json();

    let cognitoBody: Record<string, unknown>;

    if (rt) {
      cognitoBody = {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: rt },
      };
    } else {
      cognitoBody = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      };
    }

    const response = await fetch(COGNITO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify(cognitoBody),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Error connecting to authentication service' },
      { status: 500 },
    );
  }
}
