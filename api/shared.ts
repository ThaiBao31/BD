import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const SHARED_PATH = process.env.SHARED_DATA_PATH || 'public/data/shared.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

interface GitHubContent {
  sha?: string;
  content?: string;
}

async function readFromGitHub(): Promise<object | null> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${SHARED_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!res.ok) return null;
  const body = (await res.json()) as GitHubContent;
  if (!body.content) return null;

  const decoded = Buffer.from(body.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  return JSON.parse(decoded) as object;
}

async function writeToGitHub(data: object): Promise<{ ok: boolean; error?: string }> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return { ok: false, error: 'Chưa cấu hình GITHUB_TOKEN và GITHUB_REPO trên Vercel' };
  }

  let sha: string | undefined;
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${SHARED_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (getRes.ok) {
    const existing = (await getRes.json()) as GitHubContent;
    sha = existing.sha;
  }

  const content = Buffer.from(JSON.stringify(data, null, 2), 'utf-8').toString('base64');

  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${SHARED_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: 'Cập nhật dữ liệu BD Football',
        content,
        sha,
      }),
    },
  );

  if (!putRes.ok) {
    const err = (await putRes.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: err.message ?? 'Không thể ghi lên GitHub' };
  }

  return { ok: true };
}

function readLocalFile(): object | null {
  try {
    const filePath = path.join(process.cwd(), SHARED_PATH);
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as object;
  } catch {
    return null;
  }
}

function writeLocalFile(data: object): boolean {
  try {
    const filePath = path.join(process.cwd(), SHARED_PATH);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

async function readStaticFallback(req: VercelRequest): Promise<object | null> {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const proto = req.headers['x-forwarded-proto'] ?? 'https';
  if (!host) return null;

  try {
    const res = await fetch(`${proto}://${host}/data/shared.json?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as object;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const fromGitHub = await readFromGitHub();
    if (fromGitHub) return res.status(200).json(fromGitHub);

    const fromLocal = readLocalFile();
    if (fromLocal) return res.status(200).json(fromLocal);

    const fromStatic = await readStaticFallback(req);
    if (fromStatic) return res.status(200).json(fromStatic);

    return res.status(200).json({
      version: 1,
      updatedAt: new Date().toISOString(),
      players: [],
      matchSetup: {
        teamA: { formationId: '1-2-3-1', assignments: [null, null, null, null, null, null, null] },
        teamB: { formationId: '1-2-3-1', assignments: [null, null, null, null, null, null, null] },
        updatedAt: new Date().toISOString(),
      },
    });
  }

  if (req.method === 'PUT') {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    const payload = {
      ...data,
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    if (GITHUB_TOKEN && GITHUB_REPO) {
      const result = await writeToGitHub(payload);
      if (result.ok) return res.status(200).json({ ok: true });
      return res.status(500).json({ error: result.error });
    }

    if (writeLocalFile(payload)) {
      return res.status(200).json({ ok: true });
    }

    return res.status(503).json({
      error: 'Chưa cấu hình lưu chung. Thêm GITHUB_TOKEN + GITHUB_REPO trên Vercel, hoặc dùng Xuất JSON.',
      readonly: true,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
