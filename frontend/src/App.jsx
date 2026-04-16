import { useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

function sanitizeUsername(value) {
  return String(value || '').trim().replace(/^@+/, '').replace(/\s+/g, '');
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function getFallbackInitials(username) {
  return sanitizeUsername(username).slice(0, 2).toUpperCase() || 'X';
}

export default function App() {
  const [username, setUsername] = useState('');
  const [checkedUser, setCheckedUser] = useState('');
  const [profile, setProfile] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initials = useMemo(() => getFallbackInitials(checkedUser || username), [checkedUser, username]);

  async function runCheck() {
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) return;

    setLoading(true);
    setError('');
    setCheckedUser(cleanUsername);

    try {
      const [profileResponse, checkResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/profile/${encodeURIComponent(cleanUsername)}`),
        fetch(`${API_BASE_URL}/api/check/${encodeURIComponent(cleanUsername)}`, { method: 'POST' })
      ]);

      const profileJson = await profileResponse.json();
      const checkJson = await checkResponse.json();

      if (!profileResponse.ok || !profileJson.ok) {
        throw new Error(profileJson.error || 'Gagal mengambil data profil dari server.');
      }

      if (!checkResponse.ok || !checkJson.ok) {
        throw new Error(checkJson.error || 'Gagal mengambil indikator akun dari server.');
      }

      setProfile(profileJson.profile);
      setCheckResult(checkJson.check);
    } catch (err) {
      setProfile(null);
      setCheckResult(null);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <main className="main-card">
        <div className="top-badge">Shadowban Checker</div>

        <h1>cek kesehatan akun x dengan lebih mudah</h1>

        <p className="lead">
          Web ini dibuat untuk memudahkan orang-orang yang ingin melihat kondisi awal akun mereka dengan lebih cepat.
          Data profil di kartu akun diambil dari backend, jadi bukan angka buatan tampilan.
        </p>

        <p className="lead">
          Untuk bagian shadowban, hasilnya tetap dibaca sebagai indikasi awal saja. Jadi yang dibuat seakurat mungkin di sini adalah data profil akun,
          bukan vonis final soal visibilitas akun.
        </p>

        <div className="hero-grid">
          <section>
            <div className="input-row">
              <div className="input-wrap">
                <span className="at-symbol">@</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') runCheck();
                  }}
                  placeholder="contoh: XDevelopers"
                />
              </div>

              <button onClick={runCheck} disabled={loading}>
                {loading ? 'Checking...' : 'Check Account'}
              </button>
            </div>

            <div className="creator-line">
              Dibuat oleh <strong>@chiffuyu</strong>
            </div>

            <div className="legend-row">
              <span className="legend good">Hijau • aman</span>
              <span className="legend warn">Oranye • cek manual</span>
              <span className="legend bad">Merah • ada indikasi masalah</span>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-glow" />
            <div className="profile-head">
              <div className="avatar-shell">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={`Avatar ${profile.username}`} className="avatar-image" />
                ) : (
                  <div className="avatar-fallback">{initials}</div>
                )}
              </div>

              <div>
                <div className="profile-name">{profile?.name || 'User Preview'}</div>
                <div className="profile-username">{profile?.username ? `@${profile.username}` : '@username'}</div>
              </div>
            </div>

            <p className="profile-bio">
              {profile?.description || 'Masukkan username lalu cek akun untuk melihat avatar, nama, bio, dan metrik profil real dari backend.'}
            </p>

            <div className="stats-grid">
              <div className="stat-box">
                <b>{profile ? formatNumber(profile.posts) : '-'}</b>
                <span>posts</span>
              </div>
              <div className="stat-box">
                <b>{profile ? formatNumber(profile.followers) : '-'}</b>
                <span>followers</span>
              </div>
              <div className="stat-box">
                <b>{profile ? formatNumber(profile.following) : '-'}</b>
                <span>following</span>
              </div>
            </div>

            <div className="profile-meta-row">
              <span className="meta-pill">Joined {profile ? formatDate(profile.createdAt) : '-'}</span>
              <span className={`meta-pill ${profile?.verified ? 'verified' : ''}`}>
                {profile?.verified ? 'Verified' : 'Not verified'}
              </span>
            </div>

            <div className="made-by">made by @chiffuyu</div>
          </section>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <section className="result-card">
          {!checkResult ? (
            <>
              <div className="result-top">
                <div className="status-pill warn">
                  <span className="status-dot" />
                  Belum ada pengecekan
                </div>
                <div className="result-copy">Masukkan username lalu tekan tombol check untuk melihat data profil dan indikator awal akun.</div>
              </div>

              <div className="check-list">
                {[
                  ['Search visibility', 'Kemungkinan akun masih terlihat di hasil pencarian username atau tweet.'],
                  ['Reply visibility', 'Kemungkinan balasan akun masih muncul normal di thread publik.'],
                  ['Restriction signals', 'Ringkasan indikasi pembatasan visibilitas akun.']
                ].map(([title, text]) => (
                  <div className="check-item" key={title}>
                    <div>
                      <div className="check-title">{title}</div>
                      <div className="check-desc">{text}</div>
                    </div>
                    <div className="mini-pill warn">Menunggu</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="result-top">
                <div className={`status-pill ${checkResult.tone}`}>
                  <span className="status-dot" />
                  @{checkedUser} • {checkResult.label}
                </div>
                <div className="result-copy">
                  Risk score: <b>{checkResult.score}/100</b>
                  <br />
                  {checkResult.message}
                </div>
              </div>

              <div className="check-list">
                {checkResult.checks.map((item) => (
                  <div className="check-item" key={item.key}>
                    <div>
                      <div className="check-title">{item.title}</div>
                      <div className="check-desc">{item.description}</div>
                    </div>
                    <div className={`mini-pill ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <p className="footnote">
          Catatan: angka profil di atas mengikuti data yang dikembalikan backend saat request dilakukan. Jadi tampilannya bukan dummy,
          tapi tetap bisa berubah kalau akun itu sendiri berubah.
        </p>
      </main>
    </div>
  );
}
