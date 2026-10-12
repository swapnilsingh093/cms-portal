import React, { useState, useCallback } from 'react';
import ConfirmModal from '../components/admin/ConfirmModal';

export const useConfirm = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Delete',
    confirmButtonClass: 'button-danger'
  });

  const confirm = useCallback(({ title, message, confirmText, confirmButtonClass }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: title || 'Confirm Action',
        message,
        confirmText: confirmText || 'Delete',
        confirmButtonClass: confirmButtonClass || 'button-danger',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const ConfirmDialog = () => (
    <ConfirmModal {...modalState} />
  );

  return { confirm, ConfirmDialog };
};
