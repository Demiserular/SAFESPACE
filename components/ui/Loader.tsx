import React from 'react';
import './Loader.css';

const Loader = ({ className }: { className?: string }) => {
  return (
    <div className={`loader ${className}`}>
      <div className="spinner">
        <div className="double-bounce1"></div>
        <div className="double-bounce2"></div>
      </div>
    </div>
  );
};

export default Loader;
