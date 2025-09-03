import { useAtom } from 'jotai';
import { walletConnectedAtom } from '../../atoms';
import TopBar from './TopBar';
import BottomNavigation from './BottomNavigation';
import DisconnectedView from './DisconnectedView';
import PropTypes from 'prop-types';
import '../../styles/layout.css';

const MobileLayout = ({ title, children }) => {
  const [walletConnected] = useAtom(walletConnectedAtom);

  // Show disconnected view when wallet is not connected
  if (!walletConnected) {
    return <DisconnectedView />;
  }

  // Show mobile layout when wallet is connected
  return (
    <div className="mobile-layout">
      <TopBar title={title} />

      <div className="main-content">
        {children}
      </div>

      <BottomNavigation />
    </div>
  );
};

MobileLayout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default MobileLayout;
