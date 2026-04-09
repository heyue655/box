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
  return (
    <div className="app-card" onClick={onLaunch}>
      <div className="app-card-icon">{app.icon}</div>
      <div className="app-card-info">
        <h3>{app.name}</h3>
        <p>{app.description}</p>
      </div>
      <div className="app-card-arrow">›</div>
    </div>
  );
}
