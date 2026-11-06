import { useEffect, useId, useRef, type ReactNode } from "react";
import { t } from "../i18n";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  title: string;
  note?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, note, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    const onNativeClose = () => onCloseRef.current();

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onNativeClose);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onNativeClose);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedOnBackdrop.current && event.target === event.currentTarget) onClose();
        pressedOnBackdrop.current = false;
      }}
    >
      <div className="modal-body">
        <header className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {note && <p className="panel-note">{note}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label={t("ui.close")} title={t("ui.close")} onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
