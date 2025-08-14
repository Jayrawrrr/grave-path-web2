// src/components/SidebarModuleItem.jsx
import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

/**
 * A sidebar button with a hover‐tooltip.
 * Props:
 *  - icon: JSX icon (e.g. from lucide-react)
 *  - label: string (shown on hover)
 *  - active: boolean
 *  - onClick: function
 *  - className: string (optional extra class for styling)
 */
export default function SidebarModuleItem({
  icon,
  label,
  active = false,
  onClick = () => {},
  className = ''
}) {
  return (
    <Tippy
      content={label}
      placement="right"
      arrow={true}
      offset={[0, 8]}
      duration={100}
    >
      <button
        className={`sidebar-module-item ${className}${active ? ' active' : ''}`}
        onClick={onClick}
      >
        <div className="icon">{icon}</div>
        <div className="label">{label}</div>
      </button>
    </Tippy>
  );
}
