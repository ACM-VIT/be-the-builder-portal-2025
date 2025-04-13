import React, { forwardRef } from 'react'

interface RadioOption {
  id: string
  label: string
  value: string
}

interface RadioGroupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  options: RadioOption[]
  error?: string
  onChange?: (value: string) => void
  value?: string
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className = '', label, options, error, onChange, value, name, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }
    
    return (
      <div ref={ref} className={`${className}`}>
        {label && (
          <div className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </div>
        )}
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.id} className="flex items-center">
              <input
                id={option.id}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={handleChange}
                className={`
                  h-4 w-4 border-gray-300 text-pink-600 
                  focus:ring-pink-500 focus:ring-offset-0
                  ${error ? 'border-red-500' : ''}
                `}
                {...props}
              />
              <label
                htmlFor={option.id}
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
) 