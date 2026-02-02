import { createContext, useContext, useState } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    const showConfirm = (title, message, onConfirm, type = 'warning') => {
        setModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                closeModal();
            },
            type
        });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <ModalContext.Provider value={{ showConfirm }}>
            {children}
            {modal.isOpen && (
                <Modal
                    isOpen={modal.isOpen}
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onCancel={closeModal}
                    type={modal.type}
                />
            )}
        </ModalContext.Provider>
    );
}

// Custom Hook
export function useModal() {
    return useContext(ModalContext);
}
