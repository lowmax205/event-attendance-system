import React from 'react';
import { ConfirmationModal } from '@/components/ui/modal';

// Contract: simple domain-specific confirm dialog
// Props: { title, open, onOpenChange, onConfirm, children }
export default function DeleteConfirmModal(props) {
  return <ConfirmationModal variant='destructive' {...props} />;
}
