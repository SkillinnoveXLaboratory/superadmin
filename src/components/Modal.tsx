import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ModalProps {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ title, onClose, footer, children, size = 'md' }: ModalProps) {
  const widthClass =
    size === 'sm'
      ? 'sm:max-w-sm'
      : size === 'lg'
        ? 'sm:max-w-2xl'
        : size === 'xl'
          ? 'sm:max-w-4xl'
          : 'sm:max-w-lg';

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm grid place-items-center p-2 sm:p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
        className={`card w-[calc(100vw-1rem)] sm:w-full ${widthClass} flex flex-col overflow-hidden max-h-[calc(100dvh-1rem)] sm:max-h-[90vh]`}
      >
        <div className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-line">
          <h2 className="font-display text-base sm:text-lg font-semibold leading-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-900 text-2xl leading-none w-9 h-9 grid place-items-center rounded-lg hover:bg-muted shrink-0"
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-4 sm:px-6 py-4 border-t border-line bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
