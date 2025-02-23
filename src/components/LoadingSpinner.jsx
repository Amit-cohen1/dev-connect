import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingSpinner = ({ size = 120, className = '' }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <DotLottieReact
        src="https://lottie.host/e3cbf6c3-26e9-4155-a559-3a5775cdc6d4/IPxxoZIJrb.lottie"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default LoadingSpinner;