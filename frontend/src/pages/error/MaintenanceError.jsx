import React from 'react';
import StatusPage from './StatusPage';

const MaintenanceError = ({
  title = 'System Maintenance',
  description = 'We are currently performing scheduled maintenance to improve your experience.',
  reason = 'routine maintenance',
  onRetry = null,
}) => {
  const getMaintenanceDescription = () => {
    switch (reason) {
      case 'database':
        return 'Database maintenance is in progress to optimize performance and ensure data integrity.';
      case 'server':
        return 'Server maintenance is underway to apply security updates and improve system stability.';
      case 'feature-development':
        return 'We are developing new features and improvements to enhance your experience.';
      case 'security':
        return 'Security maintenance is in progress to ensure the safety of your data.';
      default:
        return description;
    }
  };

  return (
    <StatusPage
      title={title}
      description={getMaintenanceDescription()}
      status='maintenance'
      onRetry={onRetry}
      showReturnButton={true}
    />
  );
};

export default MaintenanceError;
