import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/request';
import AppCard from '../components/AppCard';
import './Portal.css';

interface AppInfo {
  appKey: string;
  name: string;
  description: string;
  icon: string;
  url: string;
}

export default function Portal() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<AppInfo[]>('/api/apps', { token })
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleLaunch = async (appKey: string) => {
    try {
      const data = await request<{ redirect_url: string }>('/sso/authorize', {
        method: 'POST',
        body: { app_key: appKey },
        token,
      });
      window.location.href = data.redirect_url;
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div className="portal-header-left">
          <img src="/logo.svg" alt="万象阁" className="portal-logo-img" />
          <h1>万象阁</h1>
        </div>
        <div className="portal-header-right">
          <button className="avatar-btn" onClick={() => navigate('/profile')}>
            {user?.nickname?.[0] || '我'}
          </button>
        </div>
      </header>

      <div className="portal-greeting">
        <h2>Hi, {user?.nickname || '用户'} 👋</h2>
        <p>选择一个应用开始使用</p>
      </div>

      <div className="portal-apps">
        {loading ? (
          <div className="portal-loading">加载中...</div>
        ) : apps.length === 0 ? (
          <div className="portal-empty">暂无可用应用</div>
        ) : (
          apps.map((app) => (
            <AppCard
              key={app.appKey}
              app={app}
              onLaunch={() => handleLaunch(app.appKey)}
            />
          ))
        )}
      </div>

      <footer className="portal-footer">
        <button
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
          className="logout-btn"
        >
          退出登录
        </button>
      </footer>
    </div>
  );
}
