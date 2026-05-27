import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Выберите опцию",
  className = "",
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // считаем положение кнопки на экране
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // fixed — координаты относительно viewport, без scrollY/scrollX
      setCoords({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", () => setIsOpen(false), { once: true });
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`ui-select flex w-full items-center justify-between text-left ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : isOpen
              ? "border-primary/50"
              : ""
        }`}
      >
        <span className={selectedOption ? "" : "text-white-soft"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-white-soft transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={dropdownRef}
            className="dropdown-panel fixed z-[9999]"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            <div className="overflow-y-auto max-h-[300px]">
              {options.map((option) => (
                <button
                  key={option.value === "" ? "__placeholder__" : option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`dropdown-item ${
                    value === option.value ? "dropdown-item-active" : ""
                  }`}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check size={18} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

      {/* Скрытый input для формы (для required атрибута) */}
      {required && (
        <input
          type="hidden"
          value={value}
          required
        />
      )}
    </div>
  );
};

export default SelectDropdown;
