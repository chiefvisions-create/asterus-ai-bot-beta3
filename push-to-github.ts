import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

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
    throw new Error('X_REPLIT_TOKEN not found');
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

async function main() {
  console.log('Connecting to GitHub...');
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  const repoName = 'astraeus-ai-trading-bot';
  const owner = user.login;
  
  let repoExists = false;
  try {
    await octokit.repos.get({ owner, repo: repoName });
    repoExists = true;
    console.log(`Repository ${repoName} already exists`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Creating repository ${repoName}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'AI-powered crypto trading bot built with Astraeus AI',
        private: false,
        auto_init: false,
      });
      console.log('Repository created!');
    } else {
      throw e;
    }
  }
  
  const filesToPush = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'drizzle.config.ts',
    'tailwind.config.ts',
    'client/index.html',
    'client/src/App.tsx',
    'client/src/main.tsx',
    'shared/schema.ts',
    'server/index.ts',
    'server/routes.ts',
    'server/storage.ts',
    'server/engine.ts',
  ];
  
  console.log('\nPushing files...');
  
  for (const filePath of filesToPush) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        let sha: string | undefined;
        try {
          const { data } = await octokit.repos.getContent({ owner, repo: repoName, path: filePath });
          if ('sha' in data) {
            sha = data.sha;
          }
        } catch (e) {}
        
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo: repoName,
          path: filePath,
          message: `Update ${filePath}`,
          content: Buffer.from(content).toString('base64'),
          sha,
        });
        console.log(`  ✓ ${filePath}`);
      }
    } catch (e: any) {
      console.log(`  ✗ ${filePath}: ${e.message}`);
    }
  }
  
  console.log(`\nDone! Your repo: https://github.com/${owner}/${repoName}`);
}

main().catch(console.error);
