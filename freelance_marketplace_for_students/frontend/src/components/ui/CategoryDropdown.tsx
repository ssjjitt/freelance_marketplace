import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

interface CategoryDropdownProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  value,
  onChange,
  placeholder = "Выберите категорию",
  required: _required = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const groupedCategories = React.useMemo(() => {
    const parents = categories.filter((cat) => !cat.parentId);
    const subcategories = categories.filter((cat) => cat.parentId);

    return parents.map((parent) => ({
      parent,
      subcategories: subcategories.filter((sub) => sub.parentId === parent.id),
    }));
  }, [categories]);

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedCategories;
    }

    const query = searchQuery.toLowerCase();
    return groupedCategories
      .map((group) => {
        const parentMatches = group.parent.name.toLowerCase().includes(query);
        const matchingSubs = group.subcategories.filter((sub) =>
          sub.name.toLowerCase().includes(query)
        );

        if (parentMatches || matchingSubs.length > 0) {
          return {
            parent: group.parent,
            subcategories: parentMatches
              ? group.subcategories
              : matchingSubs,
          };
        }
        return null;
      })
      .filter((group) => group !== null) as typeof groupedCategories;
  }, [groupedCategories, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedCategory = categories.find((cat) => cat.id.toString() === value);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`ui-select flex w-full items-center justify-between text-left ${
          isOpen ? "border-primary/50" : ""
        }`}
      >
        <span className={selectedCategory ? "" : "text-white-soft"}>
          {selectedCategory ? selectedCategory.name : placeholder}
        </span>
        <ChevronDown
          strokeWidth={1.5}
          size={18}
          className={`shrink-0 text-white-soft transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`dropdown-panel absolute z-50 mt-2 w-full transition-all duration-300 ${
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2 pointer-events-none"
        }`}
        style={{ maxHeight: "400px" }}
      >
        <div className="border-b p-3" style={{ borderColor: "var(--app-border-subtle)" }}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск категорий..."
              className="ui-input w-full py-2 pl-10 pr-3"
            />
            <Search
              strokeWidth={1.5}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white-soft"
            />
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
          {filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-white-soft text-sm">
              Категории не найдены
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.parent.id} className="py-1">
                <button
                  type="button"
                  onClick={() => handleSelect(group.parent.id.toString())}
                  className={`dropdown-item ${
                    value === group.parent.id.toString() ? "dropdown-item-active" : ""
                  }`}
                >
                  <span className="flex-1">{group.parent.name}</span>
                  {value === group.parent.id.toString() && (
                    <Check
                      strokeWidth={1.5}
                      size={18}
                      className="shrink-0 text-primary"
                    />
                  )}
                </button>

                {group.subcategories.length > 0 && (
                  <div
                    className="ml-4 border-l-2 border-primary/30"
                    style={{ backgroundColor: "var(--app-btn-bg)" }}
                  >
                    {group.subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => handleSelect(subcategory.id.toString())}
                        className={`dropdown-item pl-8 ${
                          value === subcategory.id.toString()
                            ? "dropdown-item-active"
                            : ""
                        }`}
                      >
                        <span className="flex-1 flex items-center">
                          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary/50"></span>
                          {subcategory.name}
                        </span>
                        {value === subcategory.id.toString() && (
                          <Check
                            strokeWidth={1.5}
                            size={18}
                            className="shrink-0 text-primary"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDropdown;

