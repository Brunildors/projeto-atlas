import { t } from "../i18n";
import { sessionDisplayName } from "../lib/auth";
import type { Session } from "../types";
import { Icon } from "./Icon";

interface ProfileButtonProps {
  session: Session;
  active: boolean;
}

export function ProfileButton({ session, active }: ProfileButtonProps) {
  return (
    <a
      className="profile-btn"
      href="#perfil"
      aria-label={t("app.profile.label", { name: sessionDisplayName(session) })}
      aria-current={active ? "page" : undefined}
      title={t("app.profile.title")}
    >
      <Icon name="profile" size={20} />
    </a>
  );
}
