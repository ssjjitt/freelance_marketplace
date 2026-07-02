import React, { useEffect, useRef, useState } from "react";

export type ExistingAttachment = {
  id: number;
  originalName: string;
  url: string;
};

type Props = {
  selectedFiles: File[];
  onSelectedFilesChange: (files: File[]) => void;
  existingAttachments?: ExistingAttachment[];
  onDeleteExistingAttachment?: (attachmentId: number) => Promise<void>;
  disabled?: boolean;
};

const AttachmentPicker: React.FC<Props> = ({
  selectedFiles,
  onSelectedFilesChange,
  existingAttachments = [],
  onDeleteExistingAttachment,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([]);
  const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<number[]>([]);

  useEffect(() => {
    const urls = selectedFiles.map((f) =>
      f.type.startsWith("image/") ? URL.createObjectURL(f) : null
    );
    setImagePreviews(urls);
    return () => {
      urls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [selectedFiles]);

  const addFromInput = (list: FileList | null) => {
    if (!list?.length) return;
    onSelectedFilesChange([...selectedFiles, ...Array.from(list)]);
  };

  const removeNewAt = (index: number) => {
    onSelectedFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3 text-sm">
      <span className="text-white/80">Вложения</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          addFromInput(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="ui-btn-ghost w-fit px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Прикрепить файл
      </button>

      {existingAttachments.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-white/5 bg-surface p-3 text-white/90 backdrop-blur-md">
          {existingAttachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate underline hover:text-white"
              >
                {a.originalName}
              </a>
              {onDeleteExistingAttachment && (
                <button
                  type="button"
                  disabled={disabled || deletingAttachmentIds.includes(a.id)}
                  onClick={async () => {
                    try {
                      setDeletingAttachmentIds((prev) => [...prev, a.id]);
                      await onDeleteExistingAttachment(a.id);
                    } finally {
                      setDeletingAttachmentIds((prev) => prev.filter((id) => id !== a.id));
                    }
                  }}
                  className="shrink-0 text-xs text-rose-300 hover:text-rose-200 disabled:opacity-50"
                >
                  Удалить
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {selectedFiles.length > 0 && (
        <ul className="space-y-3">
          {selectedFiles.map((file, i) => (
            <li
              key={`${file.name}-${file.size}-${i}`}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-white/10 bg-black/25 p-3"
            >
              {imagePreviews[i] ? (
                <img
                  src={imagePreviews[i]!}
                  alt=""
                  className="h-20 w-auto max-w-[200px] rounded object-contain"
                />
              ) : (
                <div className="flex h-20 min-w-[120px] items-center justify-center rounded bg-white/5 px-2 text-center text-xs text-white/60">
                  {file.name}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{file.name}</p>
                <p className="text-xs text-white/50">{(file.size / 1024).toFixed(1)} КБ</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeNewAt(i)}
                className="shrink-0 text-xs text-rose-300 hover:text-rose-200 disabled:opacity-50"
              >
                Убрать
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentPicker;
