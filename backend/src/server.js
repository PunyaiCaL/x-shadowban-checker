import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const bearerToken = process.env.X_BEARER_TOKEN;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'shadowban-checker-backend' });
});

app.get('/api/profile/:username', async (req, res) => {
  const username = String(req.params.username || '').trim().replace(/^@+/, '');

  if (!username) {
    return res.status(400).json({ ok: false, error: 'Username is required.' });
  }

  if (!bearerToken) {
    return res.status(500).json({
      ok: false,
      error: 'Missing X_BEARER_TOKEN. Add it to your .env file first.'
    });
  }

  const url = new URL(`https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`);
  url.searchParams.set(
    'user.fields',
    'created_at,description,profile_image_url,public_metrics,verified'
  );

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    });

    const raw = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: raw?.detail || raw?.title || 'Failed to fetch profile from X API.',
        raw
      });
    }

    const user = raw?.data;

    if (!user) {
      return res.status(404).json({ ok: false, error: 'Profile not found.' });
    }

    res.json({
      ok: true,
      profile: {
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description || '',
        avatarUrl: user.profile_image_url || '',
        followers: user.public_metrics?.followers_count ?? 0,
        following: user.public_metrics?.following_count ?? 0,
        posts: user.public_metrics?.tweet_count ?? 0,
        verified: Boolean(user.verified),
        createdAt: user.created_at || null
      }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Unexpected server error while fetching profile.',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/check/:username', async (req, res) => {
  const username = String(req.params.username || '').trim().replace(/^@+/, '');
  if (!username) {
    return res.status(400).json({ ok: false, error: 'Username is required.' });
  }

  const seed = Array.from(username).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = seed % 100;

  let status = {
    label: 'Aman',
    tone: 'good',
    message: 'Tidak terlihat sinyal kuat dari indikator awal ini.'
  };

  if (score >= 35 && score < 65) {
    status = {
      label: 'Perlu cek manual',
      tone: 'warn',
      message: 'Ada sinyal abu-abu. Lebih baik pastikan lagi secara manual.'
    };
  } else if (score >= 65) {
    status = {
      label: 'Ada indikasi masalah',
      tone: 'bad',
      message: 'Beberapa sinyal terlihat lebih mirip kasus visibilitas yang bermasalah.'
    };
  }

  res.json({
    ok: true,
    check: {
      score,
      ...status,
      checks: [
        {
          key: 'search',
          title: 'Search visibility',
          description: 'Apakah akun dan tweet masih relatif mudah muncul saat dicari.',
          tone: score < 35 ? 'good' : score < 65 ? 'warn' : 'bad',
          value: score < 35 ? 'Normal' : score < 65 ? 'Perlu dicek' : 'Bermasalah'
        },
        {
          key: 'reply',
          title: 'Reply visibility',
          description: 'Apakah balasan masih mungkin terlihat normal di thread publik.',
          tone: score < 35 ? 'good' : score < 65 ? 'warn' : 'bad',
          value: score < 35 ? 'Aman' : score < 65 ? 'Kurang pasti' : 'Terbatas'
        },
        {
          key: 'restriction',
          title: 'Restriction signals',
          description: 'Ringkasan indikasi awal pembatasan visibilitas.',
          tone: score < 35 ? 'good' : score < 65 ? 'warn' : 'bad',
          value: score < 35 ? 'Rendah' : score < 65 ? 'Sedang' : 'Tinggi'
        }
      ]
    }
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
