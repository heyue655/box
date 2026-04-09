import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/request';
import './Profile.css';

interface Binding {
  appKey: string;
  appName: string;
  appIcon: string;
  localUserId: string;
  createdAt: string;
}

interface UserDetail {
  id: number;
  phone: string | null;
  email: string | null;
  username: string | null;
  nickname: string;
  avatar: string;
  createdAt: string;
  bindings: Binding[];
}

export default function Profile() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<UserDetail>('/sso/userinfo', { token })
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="profile-page"><div className="profile-loading">加载中...</div></div>;
  }

  if (!user) {
    return <div className="profile-page"><div className="profile-loading">加载失败</div></div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>‹ 返回</button>
        <h1>个人中心</h1>
        <div style={{ width: 48 }} />
      </header>

      <div className="profile-card">
        <div className="profile-avatar">{user.nickname?.[0] || '我'}</div>
        <h2>{user.nickname}</h2>
        <div className="profile-info-list">
          {user.phone && (
            <div className="profile-info-item">
              <span>手机号</span><span>{user.phone}</span>
            </div>
          )}
          {user.email && (
            <div className="profile-info-item">
              <span>邮箱</span><span>{user.email}</span>
            </div>
          )}
          {user.username && (
            <div className="profile-info-item">
              <span>用户名</span><span>{user.username}</span>
            </div>
          )}
          <div className="profile-info-item">
            <span>注册时间</span>
            <span>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>已绑定应用 ({user.bindings.length})</h3>
        {user.bindings.length === 0 ? (
          <p className="profile-empty">暂无绑定，从门户进入应用时会自动绑定</p>
        ) : (
          <div className="bindings-list">
            {user.bindings.map((b) => (
              <div key={b.appKey} className="binding-item">
                <span className="binding-icon">{b.appIcon || '📱'}</span>
                <div className="binding-info">
                  <span className="binding-name">{b.appName}</span>
                  <span className="binding-time">
                    绑定于 {new Date(b.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-actions">
        <button
          className="btn-danger"
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
