import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/request';
import './Login.css';

export default function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const data = await request('/sso/login', {
          method: 'POST',
          body: { account: account.trim(), password },
        });
        login(data.token, data.user);
      } else {
        const trimmed = account.trim();
        const isPhone = /^1\d{10}$/.test(trimmed);
        const isEmail = trimmed.includes('@');

        const body: any = { password };
        if (isPhone) body.phone = trimmed;
        else if (isEmail) body.email = trimmed;
        else body.username = trimmed;
        if (nickname.trim()) body.nickname = nickname.trim();

        const data = await request('/sso/register', {
          method: 'POST',
          body,
        });
        login(data.token, data.user);
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo">📦</div>
        <h1>合跃盒子</h1>
        <p>一站式应用管理平台</p>
      </div>

      <div className="login-card">
        <div className="login-tabs">
          <button
            className={tab === 'login' ? 'active' : ''}
            onClick={() => { setTab('login'); setError(''); }}
          >
            登录
          </button>
          <button
            className={tab === 'register' ? 'active' : ''}
            onClick={() => { setTab('register'); setError(''); }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="手机号 / 邮箱 / 用户名"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {tab === 'register' && (
            <div className="form-group">
              <input
                type="text"
                placeholder="昵称（选填）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="nickname"
              />
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '请稍候...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
}
