import React from 'react'
import { cn } from '../../utils'
import { CardProps } from '../../types'

export const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
      className
    )}>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  )
}

export const SimpleCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
      className
    )}>
      {children}
    </div>
  )
}
