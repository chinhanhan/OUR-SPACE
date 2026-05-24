import { useEffect, useRef } from 'react';

export const useTilt = (options = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const maxTilt = options.max || 15; // max tilt rotation (degrees)
    const perspective = options.perspective || 1000;
    const scale = options.scale || 1.02;

    el.style.transformPerspective = `${perspective}px`;
    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'transform 0.1s ease-out';
    el.style.willChange = 'transform';

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -maxTilt;
      const tiltY = ((x - centerX) / centerX) * maxTilt;

      el.style.transform = `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    };

    const handleMouseLeave = () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      setTimeout(() => {
        if (el) el.style.transition = 'transform 0.1s ease-out';
      }, 500);
    };

    const handleDeviceOrientation = (e) => {
      if (!e.beta || !e.gamma) return;
      // beta is front/back (-180 to 180)
      // gamma is left/right (-90 to 90)
      const tiltX = Math.max(-maxTilt, Math.min(maxTilt, (e.beta - 45) / 2));
      const tiltY = Math.max(-maxTilt, Math.min(maxTilt, e.gamma / 2));
      el.style.transform = `perspective(${perspective}px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`;
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [options]);

  return ref;
};
