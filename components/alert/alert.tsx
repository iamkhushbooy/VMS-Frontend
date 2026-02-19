'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { CustomAlertProps } from './types';

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
}) => {
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        className="
          w-full
          max-w-[400px] 
          sm:max-w-[440px]
          p-0
          overflow-hidden
          rounded-2xl
          border-none
          shadow-2xl
          bg-white
          outline-none
        "
      >
        {/* Decorative Top Accent Line (Optional - adds a touch of class) */}
        <div className="h-2 w-full bg-gradient-to-r from-gray-700 to-gray-900" />

        <div className="p-6 sm:p-8">
          {title && (
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {title}
            </h2>
          )}

          {message && (
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-slate-600">
              {message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
          {buttons.map((button, index) => {
            // Logic for elegant button styling
            const isDestructive = button.style === "destructive";
            const isCancel = button.style === "cancel";
            let buttonStyles = "px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ";           
            if (isDestructive) {
              buttonStyles += "bg-red-50 text-red-600 hover:bg-red-100 hover:text-white";
            } else if (isCancel) {
              buttonStyles += "bg-slate-100 text-slate-600 hover:bg-slate-500 hover:text-white";
            } else {
              // Primary button (Default)
              buttonStyles += "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200";
            }

            return (
              <button
                key={index}
                className={buttonStyles}
                onClick={() => {
                  button.onPress?.();
                  onClose();
                }}
              >
                {button.text}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomAlert;