import React, { forwardRef } from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={`
              h-4 w-4 rounded border-gray-300 text-pink-600 
              focus:ring-pink-500 focus:ring-offset-0
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="ml-2 block text-sm font-medium text-gray-700"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
) 