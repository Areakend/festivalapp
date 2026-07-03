import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/ui/Placeholder';

// M3 replaces this with the real home feed (upcoming editions, quick stats).
export default function Home() {
  const { t } = useTranslation();
  return <Placeholder title={t('tabs.home')} />;
}
