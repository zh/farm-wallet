// src/components/LoadScript.jsx
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSetAtom } from 'jotai';
import { scriptLoadedAtom, scriptErrorAtom } from '../atoms';

const LoadScript = ({ scriptSrc }) => {
  const setScriptLoaded = useSetAtom(scriptLoadedAtom);
  const setScriptError = useSetAtom(scriptErrorAtom);

  useEffect(() => {
    if (!scriptSrc) {
      console.error('Script source is not provided.');
      setScriptError('Script source is not provided.');
      return;
    }

    // Check if the script is already loaded
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existingScript) {
      // Check if XEC wallet is available on window
      if (window.MinimalXecWallet) {
        setScriptLoaded(true);
      }
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;

    const onLoad = () => {
      // Verify the XEC wallet library is available
      if (window.MinimalXecWallet) {
        setScriptLoaded(true);
      } else {
        setScriptError('XEC wallet library loaded but MinimalXecWallet not available on window');
      }
    };

    const onError = () => setScriptError(`Failed to load script: ${scriptSrc}`);

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [scriptSrc, setScriptLoaded, setScriptError]);

  return null; // This component doesn't render anything
};

LoadScript.propTypes = {
  scriptSrc: PropTypes.string.isRequired,
};

export default LoadScript;
