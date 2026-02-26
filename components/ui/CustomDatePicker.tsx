"use client"
import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils" 
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CustomDatePickerProps {
  value: string; 
  onChange: (dateStr: string) => void;
}

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const date = value ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            // Yahan 'bg-white' aur 'hover:bg-gray-50' add kiya hai white background ke liye
            "w-full justify-start text-left font-normal bg-white text-black border-gray-200",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy-MM-dd") : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            if (newDate) {
              onChange(format(newDate, "yyyy-MM-dd"));
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}