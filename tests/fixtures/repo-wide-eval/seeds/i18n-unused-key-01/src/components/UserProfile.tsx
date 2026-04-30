import { useTranslation } from 'react-i18next';

export function UserProfile() {
  const { t } = useTranslation();
  const name = t('user.name');
  return <div>{name}</div>;
}
