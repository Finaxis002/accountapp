
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    noResultsText?: string;
    creatable?: boolean;
    onCreate?: (inputValue: string) => Promise<any>;
    className?: string;
    disabled?: boolean;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    noResultsText = "No results found.",
    creatable = false,
    onCreate,
      disabled = false,
    className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (onCreate && searchValue) {
        await onCreate(searchValue);
        setSearchValue("");
        setOpen(false);
    }
  }

  const handleInputChange = (text: string) => {
    setSearchValue(text);
    if (!open) {
      setOpen(true);
    }
  }

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setSearchValue("");
    setOpen(false);
  }

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filteredOptions = options.filter(option =>
    typeof option.label === 'string' &&
    (searchValue === "" || option.label.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const showCreateOption = creatable && searchValue && !filteredOptions.some(opt => opt.label.toLowerCase() === searchValue.toLowerCase());

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = open ? searchValue : (selectedOption ? selectedOption.label : searchValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onClick={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          />
          <ChevronsUpDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command>
          <CommandList>
            <CommandEmpty>
                {showCreateOption ? (
                    <div className="hidden" />
                ) : (
                    noResultsText
                )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                    value={searchValue}
                    onSelect={handleCreate}
                    className="flex items-center text-primary"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{searchValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
