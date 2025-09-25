
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
  const [filteredOptions, setFilteredOptions] = React.useState(options);
  const [updateKey, setUpdateKey] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  React.useEffect(() => {
    setSearchValue(selectedOption?.label || "");
  }, [value, selectedOption?.label]);

  const handleCreate = async () => {
    if (onCreate && searchValue) {
        setOpen(false); // close immediately
        await onCreate(searchValue);
        setSearchValue("");
        setFilteredOptions(options);
        setUpdateKey(prev => prev + 1);
    }
  }

  const handleInputChange = (text: string) => {
    setSearchValue(text);
    setFilteredOptions(options.filter(option =>
      typeof option.label === 'string' &&
      (text === "" || option.label.toLowerCase().includes(text.toLowerCase()))
    ));
    setUpdateKey(prev => prev + 1);
    if (!open) {
      setOpen(true);
    }
  }

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    const newSelected = options.find((option) => option.value === selectedValue);
    setSearchValue(newSelected?.label || "");
    setFilteredOptions(options);
    setUpdateKey(prev => prev + 1);
    setOpen(false);
  }

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const showCreateOption = creatable && searchValue && !filteredOptions.some(opt => opt.label.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onClick={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                if (open && filteredOptions.length > 0) {
                  handleSelect(filteredOptions[0].value);
                }
              }
            }}
            placeholder={searchValue ? "" : placeholder}
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
