import React, { forwardRef } from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, fullWidth = false, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <textarea
          className={`px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
          disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${fullWidth ? 'w-full' : ''}
          ${className || ''}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
) 