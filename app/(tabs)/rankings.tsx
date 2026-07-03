import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/ui/Placeholder';

// M4 replaces this with the Bayesian community rankings.
export default function Rankings() {
  const { t } = useTranslation();
  return <Placeholder title={t('rankings.title')} />;
}
