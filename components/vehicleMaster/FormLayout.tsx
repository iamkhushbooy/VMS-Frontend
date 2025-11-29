"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const FormSection = ({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: any
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("rounded-xl border bg-card/50 p-6 shadow-sm space-y-4", className)}>
    <div className="flex items-center gap-2.5 border-b pb-3 mb-2">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-lg tracking-tight text-foreground">
        {title}
      </h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      {children}
    </div>
  </div>
)

export const InputGroup = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-muted-foreground">
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
)
