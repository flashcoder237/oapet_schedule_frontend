// src/components/ui/use-toast.ts
"use client";

import { useState, useEffect, createContext, useContext } from "react";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: "default" | "destructive";
  open?: boolean;
};

type ToastActionElement = React.ReactElement;

type ToastContextType = {
  toasts: ToastProps[];
  addToast: (props: Omit<ToastProps, "id">) => void;
  updateToast: (id: string, props: Partial<ToastProps>) => void;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
  toast: (props: Omit<ToastProps, "id">) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Function to add a new toast
  const addToast = (props: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...props, id, open: true };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    if (props.duration !== Infinity) {
      setTimeout(() => {
        dismissToast(id);
      }, props.duration || 5000);
    }

    return id;
  };

  // Function to update an existing toast
  const updateToast = (id: string, props: Partial<ToastProps>) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, ...props } : toast
      )
    );
  };

  // Function to dismiss a toast (animate out)
  const dismissToast = (id: string) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, open: false } : toast
      )
    );
    
    // Remove after animation finishes
    setTimeout(() => {
      removeToast(id);
    }, 300);
  };

  // Function to remove a toast
  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Alias for addToast
  const toast = addToast;

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, dismissToast, removeToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

export type { ToastProps, ToastActionElement };

// Default toast function for ease of use
export const toast = {
  default: (props: Omit<ToastProps, "id" | "variant">) => {
    const { addToast } = useToast();
    return addToast({ ...props, variant: "default" });
  },
  destructive: (props: Omit<ToastProps, "id" | "variant">) => {
    const { addToast } = useToast();
    return addToast({ ...props, variant: "destructive" });
  },
};