import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

export async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function getGitHubUser() {
  const octokit = await getGitHubClient();
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

export async function createRepo(name: string, description: string, isPrivate: boolean = true) {
  const octokit = await getGitHubClient();
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: false,
  });
  return data;
}

export async function getRepo(owner: string, repo: string) {
  const octokit = await getGitHubClient();
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return data;
  } catch (e: any) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function pushFile(owner: string, repo: string, path: string, content: string, message: string, sha?: string) {
  const octokit = await getGitHubClient();
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    sha,
  });
  return data;
}

export async function getFileContent(owner: string, repo: string, path: string) {
  const octokit = await getGitHubClient();
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    return data;
  } catch (e: any) {
    if (e.status === 404) return null;
    throw e;
  }
}
