
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

  const selectedOption = options.find((option) => option.value === value);

  React.useEffect(() => {
    if (open) {
      setSearchValue("");
      setFilteredOptions(options);
    }
  }, [open, options]);

  React.useEffect(() => {
    if (!open) {
      setSearchValue(selectedOption?.label || "");
    }
  }, [open, value, options]);

  const handleCreate = async () => {
    if (onCreate && searchValue) {
        setOpen(false); // close immediately
        await onCreate(searchValue);
        setSearchValue("");
        setFilteredOptions(options);
    }
  }

  const handleInputChange = (text: string) => {
    setSearchValue(text);
    setFilteredOptions(options.filter(option =>
      typeof option.label === 'string' &&
      (text === "" || option.label.toLowerCase().includes(text.toLowerCase()))
    ));
    if (!open) {
      setOpen(true);
    }
  }

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    const newSelected = options.find((option) => option.value === selectedValue);
    setSearchValue(newSelected?.label || "");
    setFilteredOptions(options);
    setOpen(false);
  }

  const showCreateOption = creatable && searchValue && !filteredOptions.some(opt => opt.label.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption?.label || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={handleInputChange}
          />
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
