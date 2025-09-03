import MobileLayout from '../components/Layout/MobileLayout';
import TokenSend from '../components/TokenSend';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/send.css';

const SendPage = () => {
  const { t } = useTranslation();

  return (
    <MobileLayout title={t('navigation.send')}>
      <div className="send-page-content">
        <TokenSend />
      </div>
    </MobileLayout>
  );
};

export default SendPage;
