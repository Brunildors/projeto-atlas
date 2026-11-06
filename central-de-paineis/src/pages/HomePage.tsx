import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { t } from "../i18n";
import type { DashboardPageProps, IconName } from "../types";

function Shortcut({ href, icon, name }: { href: string; icon: IconName; name: string }) {
  return (
    <a className="shortcut" href={href}>
      <span className="shortcut-icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <span className="shortcut-name">{name}</span>
      <span className="shortcut-go" aria-hidden="true">
        {"→"}
      </span>
    </a>
  );
}

export function HomePage({ dashboards, activeId }: DashboardPageProps) {
  const shortcuts = dashboards.filter((item) => item.id !== activeId && !item.hideFromMenu);

  return (
    <div className="grid">
      <Panel
        title={t("home.shortcuts")}
        note={t("home.shortcuts.note")}
        span={12}
        className="shortcuts-panel panel--frame"
      >
        <nav className="shortcuts" aria-label={t("home.shortcuts.nav")}>
          {shortcuts.map((item) => (
            <Shortcut key={item.id} href={`#${item.id}`} icon={item.icon} name={item.name} />
          ))}
        </nav>
      </Panel>
    </div>
  );
}
