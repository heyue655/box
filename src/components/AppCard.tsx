import './AppCard.css';

interface Props {
  app: {
    appKey: string;
    name: string;
    description: string;
    icon: string;
    url: string;
  };
  onLaunch: () => void;
}

export default function AppCard({ app, onLaunch }: Props) {
  const isImage = app.icon.startsWith('/') || app.icon.startsWith('http');

  return (
    <div className="app-card" onClick={onLaunch}>
      <div className="app-card-icon">
        {isImage ? (
          <img src={app.icon} alt={app.name} className="app-card-icon-img" />
        ) : (
          app.icon
        )}
      </div>
      <div className="app-card-info">
        <h3>{app.name}</h3>
        <p>{app.description}</p>
      </div>
      <div className="app-card-arrow">›</div>
    </div>
  );
}
