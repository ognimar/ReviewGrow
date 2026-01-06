import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/business.manage'];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/api/auth/google/callback`
  );
}

export function generateAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getAccounts(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch accounts');
  }
  
  return response.json();
}

export async function getLocations(accessToken: string, accountName: string) {
  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,metadata`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch locations');
  }
  
  return response.json();
}

export async function getReviews(accessToken: string, locationName: string) {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch reviews');
  }
  
  return response.json();
}

export function generateReviewLink(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

export async function replyToReview(
  accessToken: string, 
  reviewName: string, 
  replyText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: replyText,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error?.message || 'Failed to reply' };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}
