import { useCallback, useEffect } from 'react';
import { throttle } from 'lodash';

export const ComputeSize = ({ componentRef, setHeight, height, setWidth, width, children, forceCompute }) => {
  const resize = useCallback(
    throttle(e => {
      const newHeight = componentRef && componentRef.offsetHeight ? componentRef.offsetHeight : null;
      const newWidth = componentRef && componentRef.offsetWidth ? componentRef.offsetWidth : null;
      if (newHeight !== null && newHeight !== height && setHeight) {
        setHeight(newHeight);
      }
      if (newWidth !== null && newWidth !== width && setWidth) {
        setWidth(newWidth);
      }
    }, 250),
    [componentRef, height, setHeight, setWidth, width]
  );

  useEffect(() => {
    if (componentRef && forceCompute) {
      resize();
    }
  }, [componentRef, forceCompute, resize]);

  useEffect(() => {
    if (componentRef) {
      resize();
      window.addEventListener('resize', resize);
    }

    return () => {
      if (componentRef) {
        window.removeEventListener('resize', resize);
      }
    };
  }, [componentRef, resize]);

  return children;
};
