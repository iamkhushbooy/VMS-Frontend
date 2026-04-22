
"use client"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils" 
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface CustomDatePickerProps {
  value: string; 
  onChange: (dateStr: string) => void;
  showTime?: boolean;
}

export function CustomDatePicker({ value, onChange, showTime = false }: CustomDatePickerProps) {
  const date = value ? new Date(value) : undefined;
  const timeString = value && value.includes("T") ? value.split("T")[1].substring(0, 5) : "00:00";

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const dateStr = format(newDate, "yyyy-MM-dd");
      if (showTime) {
        onChange(`${dateStr}T${timeString}`);
      } else {
        onChange(dateStr);
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      onChange(`${dateStr}T${newTime}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-white text-black border-gray-200",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            showTime ? format(date, "yyyy-MM-dd HH:mm") : format(date, "yyyy-MM-dd")
          ) : (
            <span>Select date {showTime && "& time"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
        {/* Agar showTime true hai, toh Calendar ke neeche Time Input dikhayen */}
        {showTime && (
          <div className="p-3 border-t border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <Clock className="h-4 w-4 text-gray-500" />
            <Input
              type="time"
              value={timeString}
              onChange={handleTimeChange}
              className="w-full bg-white h-9"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}