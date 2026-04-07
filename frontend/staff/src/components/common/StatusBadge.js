import React from 'react';
import { getStatusColor, getStatusLabel } from '../../utils/statusHelpers';

/**
 * StatusBadge — renders a Bootstrap badge for any entity status
 *
 * Props:
 *  status  {string}                          - e.g. 'pending', 'confirmed'
 *  type    {'booking'|'order'|'contact'}     - entity type for color mapping
 *  className {string}                        - optional extra classes
 */
const StatusBadge = ({ status, type = 'booking', className = '' }) => {
  const color = getStatusColor(type, status);
  const label = getStatusLabel(type, status);

  return (
    <span className={`badge bg-${color} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
