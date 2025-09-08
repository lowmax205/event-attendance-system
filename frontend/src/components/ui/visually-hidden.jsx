import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden';
import * as React from 'react';

function VisuallyHidden({ ...props }) {
  return <VisuallyHiddenPrimitive.Root {...props} />;
}

export { VisuallyHidden };
