import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/ui/Placeholder';

// M4 replaces this with the DJ Mag Top 100 progress tracker.
export default function DjMag() {
  const { t } = useTranslation();
  return <Placeholder title={t('djmag.title')} />;
}
