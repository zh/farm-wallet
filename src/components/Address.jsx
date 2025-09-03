import PropTypes from 'prop-types';
import { useAtom, useSetAtom } from 'jotai';
import { QRCodeSVG } from 'qrcode.react';
import { notificationAtom, walletConnectedAtom, walletAtom } from '../atoms';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/address.css';

const Address = ({
  addressFormat = 'long',
  showQR = true,
}) => {
  const { t } = useTranslation();
  const setNotification = useSetAtom(notificationAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);

  if (!walletConnected || !wallet) {
    return null;
  }

  const shortify = (address) => {
    // Handle XEC address format (ecash:prefix)
    const addressPart = address.includes(':') ? address.split(':')[1] : address;
    return `${addressPart.slice(0, 4)}...${addressPart.slice(-4)}`;
  };

  const handleCopyToClipboard = (address) => {
    navigator.clipboard.writeText(address).then(
      () => {
        setNotification({ type: 'success', message: 'Address copied to clipboard!' });
      },
      (err) => {
        console.error('Failed to copy address: ', err);
        setNotification({ type: 'error', message: 'Failed to copy address.' });
      }
    );
  };

  // Get the XEC address from wallet
  const xecAddress = wallet?.walletInfo?.xecAddress || wallet?.walletInfo?.address;

  return (
    <>
      {showQR && (
        <div className="qr-code-container" onClick={() => handleCopyToClipboard(xecAddress)}>
          <QRCodeSVG
            value={xecAddress}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin={true}
            marginSize={2}
          />
          <p className="qr-code-instruction">{t('wallet.clickQrToCopy')}</p>
        </div>
      )}
      <p className="wallet-address wallet-address-long">
        <strong>{addressFormat === 'long' ? xecAddress : shortify(xecAddress)}</strong>
      </p>
      <p className="wallet-address wallet-address-short">
        <strong>{shortify(xecAddress)}</strong>
      </p>
    </>
  );
};

// PropTypes validation
Address.propTypes = {
  addressFormat: PropTypes.oneOf(['short', 'long']).isRequired, // 'short' or 'long' format
  showQR: PropTypes.bool, // Whether to display the QR code
};

export default Address;
