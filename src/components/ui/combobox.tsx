
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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("");

  const handleCreate = async () => {
    if (onCreate && inputValue) {
        await onCreate(inputValue);
        setInputValue("");
        setOpen(false);
    }
  }

  const handleInputChange = (text: string) => {
    if (creatable) {
        // When user types, we clear the selection
        // so form validation uses the new typed value.
        const match = options.find(option => option.label.toLowerCase() === text.toLowerCase());
        if (!match) {
            onChange("");
        }
    }
    setInputValue(text);
  }

  const filteredOptions = options.filter(option => 
    typeof option.label === 'string' && option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  const showCreateOption = creatable && inputValue && !filteredOptions.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue}
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
                  onSelect={(currentLabel) => {
                    const selectedOption = options.find(opt => opt.label.toLowerCase() === currentLabel.toLowerCase());
                    if (selectedOption) {
                      onChange(selectedOption.value === value ? "" : selectedOption.value)
                    }
                    setOpen(false)
                  }}
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
                    value={inputValue}
                    onSelect={handleCreate}
                    className="flex items-center text-primary"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
