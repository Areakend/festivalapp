import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/ui/Placeholder';

// M3 replaces this with the festival catalog (search + filters).
export default function Discover() {
  const { t } = useTranslation();
  return <Placeholder title={t('tabs.discover')} />;
}
