import React from 'react';
import './Header.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = 'WhimsyWall',
  subtitle = 'Your Creative Moodboard Canvas',
}) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
};

export default Header;
