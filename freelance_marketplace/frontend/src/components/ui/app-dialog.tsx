import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

export type AppAlertVariant = "info" | "error" | "success";

type DialogApi = {
  alert: (message: string, variant?: AppAlertVariant) => Promise<void>;
  confirm: (message: string, options?: { danger?: boolean }) => Promise<boolean>;
  prompt: (
    message: string,
    options?: { placeholder?: string; initialValue?: string }
  ) => Promise<string | null>;
};

let dialogApiRef: DialogApi | null = null;

function setDialogApi(api: DialogApi | null) {
  dialogApiRef = api;
}

export const appDialog: DialogApi = {
  alert(message: string, variant: AppAlertVariant = "info") {
    if (!dialogApiRef) {
      window.alert(message);
      return Promise.resolve();
    }
    return dialogApiRef.alert(message, variant);
  },
  confirm(message: string, options?: { danger?: boolean }) {
    if (!dialogApiRef) {
      return Promise.resolve(window.confirm(message));
    }
    return dialogApiRef.confirm(message, options);
  },
  prompt(message: string, options?: { placeholder?: string; initialValue?: string }) {
    if (!dialogApiRef) {
      const v = window.prompt(message, options?.initialValue ?? "");
      return Promise.resolve(v === null ? null : v);
    }
    return dialogApiRef.prompt(message, options);
  },
};

type AlertState = {
  message: string;
  variant: AppAlertVariant;
  resolve: () => void;
};

type ConfirmState = {
  message: string;
  danger: boolean;
  resolve: (value: boolean) => void;
};

type PromptState = {
  message: string;
  placeholder?: string;
  initialValue?: string;
  resolve: (value: string | null) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useAppDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    return appDialog;
  }
  return ctx;
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const promptInputRef = useRef<HTMLInputElement>(null);

  const closeAlert = useCallback(() => {
    setAlertState((prev) => {
      if (prev) prev.resolve();
      return null;
    });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    setConfirmState((prev) => {
      if (prev) prev.resolve(value);
      return null;
    });
  }, []);

  const closePrompt = useCallback((value: string | null) => {
    setPromptState((prev) => {
      if (prev) prev.resolve(value);
      return null;
    });
    setPromptValue("");
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      alert(message: string, variant: AppAlertVariant = "info") {
        return new Promise<void>((resolve) => {
          setAlertState({ message, variant, resolve });
        });
      },
      confirm(message: string, options?: { danger?: boolean }) {
        return new Promise<boolean>((resolve) => {
          setConfirmState({
            message,
            danger: options?.danger ?? false,
            resolve,
          });
        });
      },
      prompt(message: string, options?: { placeholder?: string; initialValue?: string }) {
        return new Promise<string | null>((resolve) => {
          setPromptState({
            message,
            placeholder: options?.placeholder,
            initialValue: options?.initialValue,
            resolve,
          });
        });
      },
    }),
    []
  );

  useLayoutEffect(() => {
    setDialogApi(api);
    return () => setDialogApi(null);
  }, [api]);

  useEffect(() => {
    if (promptState) {
      setPromptValue(promptState.initialValue ?? "");
      queueMicrotask(() => promptInputRef.current?.focus());
    }
  }, [promptState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (promptState) closePrompt(null);
      else if (alertState) closeAlert();
      else if (confirmState) closeConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alertState, confirmState, promptState, closeAlert, closeConfirm, closePrompt]);

  const iconForVariant = (v: AppAlertVariant) => {
    if (v === "error")
      return (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-error/10 text-error">
          <CircleAlert strokeWidth={1.5} size={28} />
        </div>
      );
    if (v === "success")
      return (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success">
          <CircleCheck strokeWidth={1.5} size={28} />
        </div>
      );
    return (
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Info strokeWidth={1.5} size={28} />
      </div>
    );
  };

  return (
    <DialogContext.Provider value={api}>
      {children}

      {alertState && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAlert();
          }}
        >
          <div
            className="modal-panel w-full max-w-md p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-dialog-alert-title"
          >
            {iconForVariant(alertState.variant)}
            <p
              id="app-dialog-alert-title"
              className="text-sm leading-relaxed text-white/95 whitespace-pre-wrap"
            >
              {alertState.message}
            </p>
            <button
              type="button"
              className="ui-btn-primary mt-6 w-full py-2.5"
              onClick={closeAlert}
            >
              ОК
            </button>
          </div>
        </div>
      )}

      {confirmState && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirm(false);
          }}
        >
          <div
            className="modal-panel w-full max-w-md p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-dialog-confirm-title"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-white/80">
              <CircleAlert strokeWidth={1.5} size={26} />
            </div>
            <p
              id="app-dialog-confirm-title"
              className="text-sm leading-relaxed text-white/95 whitespace-pre-wrap"
            >
              {confirmState.message}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="ui-btn-outline flex-1 py-2.5"
                onClick={() => closeConfirm(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={
                  confirmState.danger
                    ? "ui-btn-outline-danger flex-1 py-2.5"
                    : "ui-btn-primary flex-1 py-2.5"
                }
                onClick={() => closeConfirm(true)}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {promptState && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePrompt(null);
          }}
        >
          <div
            className="modal-panel w-full max-w-md p-6 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-prompt-title"
          >
            <p
              id="app-dialog-prompt-title"
              className="mb-4 text-sm font-medium leading-relaxed text-white/95"
            >
              {promptState.message}
            </p>
            <input
              ref={promptInputRef}
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptState.placeholder}
              className="ui-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  closePrompt(promptValue);
                }
              }}
            />
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="ui-btn-outline flex-1 py-2.5 sm:flex-initial sm:min-w-[120px]"
                onClick={() => closePrompt(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="ui-btn-primary flex-1 py-2.5 sm:flex-initial sm:min-w-[120px]"
                onClick={() => closePrompt(promptValue)}
              >
                ОК
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
