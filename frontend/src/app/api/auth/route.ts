import { type NextRequest, NextResponse } from 'next/server';

const COGNITO_ENDPOINT = process.env.COGNITO_ENDPOINT || 'http://floci:4566';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(COGNITO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify(body),
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
