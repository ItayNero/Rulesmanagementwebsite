import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Label } from './label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { cn } from './utils';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const displayValue = value.length > 0
    ? `${value.length} selected`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            !value.length && 'text-muted-foreground',
            className
          )}
          onClick={() => !disabled && setOpen(!open)}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {options.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`multi-select-${option}`}
                  checked={value.includes(option)}
                  onCheckedChange={() => handleToggle(option)}
                />
                <Label
                  htmlFor={`multi-select-${option}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))
          )}
        </div>
        {value.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange([])}
            >
              Clear all ({value.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}