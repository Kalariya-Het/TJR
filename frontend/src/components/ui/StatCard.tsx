import React from 'react'
import { cn } from '../../utils'
import { StatCardProps } from '../../types'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  className 
}) => {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
      className
    )}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={cn(
              'text-sm font-medium flex items-center mt-1',
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            )}>
              {change.type === 'increase' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              {change.value > 0 ? '+' : ''}{change.value.toFixed(1)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
