import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'textarea' | 'date' | 'time';
  placeholder?: string;
  rows?: number;
  className?: string;
  readOnly?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  rows = 3,
  className = '',
  readOnly = false,
}) => {
  const readOnlyClasses = readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white';
  
  const commonProps = {
    id: name,
    name,
    value,
    onChange,
    placeholder,
    readOnly,
    className: `w-full px-3 py-2 border border-slate-300 text-slate-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder:text-slate-400 ${readOnlyClasses} ${className}`,
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea {...commonProps} rows={rows} />
      ) : (
        <input type={type} {...commonProps} />
      )}
    </div>
  );
};