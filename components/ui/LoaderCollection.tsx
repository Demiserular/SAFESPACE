import React from 'react';
import './LoaderCollection.css';

// Collection of different loader types
export type LoaderType = 
  | 'pulse'
  | 'bounce'
  | 'wave'
  | 'spin'
  | 'dots'
  | 'progress';

interface LoaderProps {
  type?: LoaderType;
  message?: string;
}

export const LoaderCollection: React.FC<LoaderProps> = ({ 
  type = 'pulse',
  message = 'Loading...'
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'pulse':
        return (
          <div className="loader-pulse">
            <div className="pulse-circle"></div>
          </div>
        );
      case 'bounce':
        return (
          <div className="loader-bounce">
            <div className="bounce-circle bounce1"></div>
            <div className="bounce-circle bounce2"></div>
            <div className="bounce-circle bounce3"></div>
          </div>
        );
      case 'wave':
        return (
          <div className="loader-wave">
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
          </div>
        );
      case 'spin':
        return (
          <div className="loader-spin">
            <div className="spin-circle"></div>
          </div>
        );
      case 'dots':
        return (
          <div className="loader-dots">
            <div className="dots-circle"></div>
            <div className="dots-circle"></div>
            <div className="dots-circle"></div>
          </div>
        );
      case 'progress':
        return (
          <div className="loader-progress">
            <div className="progress-bar"></div>
          </div>
        );
      default:
        return (
          <div className="loader-pulse">
            <div className="pulse-circle"></div>
          </div>
        );
    }
  };

  return (
    <div className="loader-container">
      {renderLoader()}
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};

export default LoaderCollection;
