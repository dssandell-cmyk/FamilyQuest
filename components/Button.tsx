import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-xl font-display font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-indigo-600 shadow-indigo-200",
    secondary: "bg-secondary text-white hover:bg-pink-600 shadow-pink-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-green-200",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 shadow-none"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};