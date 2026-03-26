import { GraphQLClient } from 'graphql-request';
import { WCL_CLIENT_ID, WCL_CLIENT_SECRET } from '$env/static/private';

const WCL_TOKEN_URL = 'https://www.warcraftlogs.com/oauth/token';
const WCL_API_URL = 'https://fresh.warcraftlogs.com/api/v2/client';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
	if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

	const credentials = Buffer.from(`${WCL_CLIENT_ID}:${WCL_CLIENT_SECRET}`).toString('base64');
	const res = await fetch(WCL_TOKEN_URL, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${credentials}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials'
	});

	if (!res.ok) throw new Error(`WCL token error: ${res.status}`);

	const data = await res.json();
	cachedToken = data.access_token;
	tokenExpiry = Date.now() + data.expires_in * 1000 - 60_000; // 1min buffer

	return cachedToken!;
}

export async function getWCLClient(): Promise<GraphQLClient> {
	const token = await getAccessToken();
	return new GraphQLClient(WCL_API_URL, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
}
