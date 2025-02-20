import React, { useState, useEffect, useRef } from 'react';

const ProjectMascot = ({ message, isVisible, position = 'left' }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [bounce, setBounce] = useState(false);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setBounce(true);
      const animTimer = setTimeout(() => setIsAnimating(false), 300);
      const bounceTimer = setTimeout(() => setBounce(false), 2000);
      return () => {
        clearTimeout(animTimer);
        clearTimeout(bounceTimer);
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }
  }, [isVisible, message]);

  const handleMouseEnter = () => {
    setBounce(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setBounce(false);
    hideTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 8000);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed ${position === 'left' ? 'left-4' : 'right-4'} bottom-4 z-50 mascot-fade-in mascot-hover`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-end space-x-2">
        <div className={`bg-white rounded-2xl shadow-xl p-4 max-w-xs transform transition-all duration-300 ${
          isAnimating ? 'scale-110' : 'scale-100'
        } ${bounce ? 'mascot-bounce' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=devbot&backgroundColor=b6e3f4"
                alt="DevBot"
                className={`w-12 h-12 rounded-full ${bounce ? 'mascot-pulse' : ''}`}
              />
            </div>
            <div className="mascot-message">
              <p className="text-sm font-medium text-gray-900">DevBot</p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMascot;