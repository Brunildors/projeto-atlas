import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { t } from "../i18n";

const DRAG_THRESHOLD = 6; // px. abaixo disso é clique, não arrasto

interface ReorderOptions {
  ids: string[];
  onReorder: (ids: string[]) => void;
  labelOf: (id: string) => string;
}

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
}

function moveTo(ids: string[], id: string, index: number): string[] {
  const rest = ids.filter((item) => item !== id);
  rest.splice(index, 0, id);
  return rest;
}

const sameOrder = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index]);

export function useReorder({ ids, onReorder, labelOf }: ReorderOptions) {
  const [preview, setPreview] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const drag = useRef<DragState | null>(null);
  const previewRef = useRef<string[] | null>(null);
  const swallowClick = useRef(false);
  const refocusId = useRef<string | null>(null);

  const latest = useRef({ ids, onReorder, labelOf });
  latest.current = { ids, onReorder, labelOf };

  useEffect(() => {
    const showPreview = (next: string[] | null) => {
      previewRef.current = next;
      setPreview(next);
    };

    const finish = (commit: boolean) => {
      const state = drag.current;
      const next = previewRef.current;
      drag.current = null;
      document.body.classList.remove("is-reordering");
      showPreview(null);
      setDraggingId(null);

      if (!state?.active) return;

      // o navegador dispara um click no fim do arrasto, isso evita abrir a pasta sem querer
      swallowClick.current = true;
      window.setTimeout(() => {
        swallowClick.current = false;
      }, 0);

      const { ids: current, onReorder: save, labelOf: label } = latest.current;
      if (commit && next && !sameOrder(next, current)) {
        save(next);
        setAnnouncement(t("proj.position", { label: label(state.id), pos: next.indexOf(state.id) + 1, total: next.length }));
      }
    };

    const onMove = (event: PointerEvent) => {
      const state = drag.current;
      if (!state || event.pointerId !== state.pointerId) return;

      if (!state.active) {
        if (Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < DRAG_THRESHOLD) return;
        state.active = true;
        document.body.classList.add("is-reordering");
        setDraggingId(state.id);
        showPreview(latest.current.ids);
      }

      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-reorder-id]");
      const overId = target?.dataset.reorderId;
      const current = previewRef.current;
      if (!overId || overId === state.id || !current || !current.includes(overId)) return;

      showPreview(moveTo(current, state.id, current.indexOf(overId)));
    };

    const onUp = (event: PointerEvent) => {
      if (drag.current?.pointerId === event.pointerId) finish(true);
    };
    const onCancel = (event: PointerEvent) => {
      if (drag.current?.pointerId === event.pointerId) finish(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && drag.current?.active) finish(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("is-reordering");
    };
  }, []);

  useLayoutEffect(() => {
    const id = refocusId.current;
    if (!id) return;
    refocusId.current = null;
    document
      .querySelector<HTMLElement>(`[data-reorder-id="${CSS.escape(id)}"] [data-reorder-handle]`)
      ?.focus();
  }, [ids]);

  function itemProps(id: string) {
    return {
      "data-reorder-id": id,
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        if (event.button !== 0 || drag.current) return;
        const fromHandle = (event.target as Element).closest("[data-reorder-handle]") !== null;
        if (event.pointerType !== "mouse" && !fromHandle) return;

        drag.current = {
          id,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          active: false,
        };
      },
      onClickCapture: (event: React.MouseEvent<HTMLElement>) => {
        if (!swallowClick.current) return;
        event.preventDefault();
        event.stopPropagation();
      },
    };
  }

  function handleProps(id: string) {
    return {
      "data-reorder-handle": "",
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        const current = latest.current.ids;
        const index = current.indexOf(id);
        let target: number;

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = index - 1;
        else if (event.key === "ArrowRight" || event.key === "ArrowDown") target = index + 1;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = current.length - 1;
        else return;

        event.preventDefault();
        if (target < 0 || target >= current.length || target === index) return;

        refocusId.current = id;
        onReorder(moveTo(current, id, target));
        setAnnouncement(t("proj.position", { label: labelOf(id), pos: target + 1, total: current.length }));
      },
    };
  }

  return {
    order: preview ?? ids,
    draggingId,
    announcement,
    itemProps,
    handleProps,
  };
}
