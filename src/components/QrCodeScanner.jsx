import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import PropTypes from 'prop-types';

const QrCodeScanner = ({ onAddressDetected }) => {
  const [error, setError] = useState(null);

  const handleScan = (result) => {
    if (result && result.length > 0) {
      onAddressDetected(result);
    }
  };

  const handleError = (error) => {
    console.error('QR Scanner error:', error);
    setError(error?.message || 'QR Scanner failed');
  };

  const handleRetry = () => {
    setError(null);
  };

  if (error) {
    return (
      <div className="qr-scanner-error">
        <p style={{ color: '#f44336', marginBottom: '8px' }}>
          Camera Error: {error}
        </p>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '12px' }}>
          Please enter the eCash address manually above.
        </p>
        <button
          onClick={handleRetry}
          className="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="qr-scanner-active">
      <div className="scanner-container">
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '300px',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }}
            styles={{
              container: {
                width: '100%',
                height: 'auto'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

QrCodeScanner.propTypes = {
  onAddressDetected: PropTypes.func.isRequired,
};

export default QrCodeScanner;
