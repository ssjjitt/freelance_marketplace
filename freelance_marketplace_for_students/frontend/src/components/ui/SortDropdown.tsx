import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom"; // импортируем портал
import { Check, ChevronDown } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
  placeholder?: string;
  className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Сортировка",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // считаем положение кнопки на экране
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
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
      window.addEventListener('scroll', () => setIsOpen(false), { once: true });
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
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
        onClick={() => setIsOpen(!isOpen)}
        className={`ui-select flex w-full items-center justify-between text-left ${
          isOpen ? "border-primary/50" : ""
        }`}
      >
        <span>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-white-soft transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && createPortal(
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
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`dropdown-item ${
                  value === option.value ? "dropdown-item-active" : ""
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={18} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>,
        document.body // рендерим в корень страницы
      )}
    </div>
  );
};

export default SortDropdown;