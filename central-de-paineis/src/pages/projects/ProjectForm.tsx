import { useState } from "react";
import { FormField } from "../../components/FormField";
import { t } from "../../i18n";
import { useTouched } from "../../components/useTouched";
import {
  PROJECT_PRIORITIES,
  PROJECT_TITLE_MAX_LENGTH,
  projectDueDateError,
  projectPriorityLabel,
  projectTitleError,
} from "../../lib/projects";
import type { ProjectPriority } from "../../types";

type Field = "title" | "dueDate";

export interface ProjectDraft {
  title: string;
  description: string;
  dueDate: string;
  priority: ProjectPriority;
}

interface ProjectFormProps {
  today: string;
  onSave: (draft: ProjectDraft) => boolean;
  onCancel: () => void;
}

export function ProjectForm({ today, onSave, onCancel }: ProjectFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("media");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useTouched<Field>();

  const errors: Record<Field, string | null> = {
    title: projectTitleError(title),
    dueDate: projectDueDateError(dueDate, today),
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.submit();
    setFormError(null);

    if (Object.values(errors).some(Boolean)) return;

    if (!onSave({ title, description, dueDate, priority })) {
      setFormError(t("proj.err.save"));
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <FormField id="projeto-nome" label={t("proj.field.name")} flag="required" error={form.shown("title", errors.title)}>
        {(control) => (
          <input
            {...control}
            data-autofocus
            className="input"
            type="text"
            maxLength={PROJECT_TITLE_MAX_LENGTH}
            placeholder={t("proj.namePlaceholder")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => form.touch("title")}
          />
        )}
      </FormField>
      <FormField id="projeto-descricao" label={t("proj.field.description")} flag="optional">
        {(control) => (
          <textarea
            {...control}
            className="input textarea"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        )}
      </FormField>
      <div className="field-row">
        <FormField id="projeto-prazo" label={t("proj.field.due")} flag="optional" error={form.shown("dueDate", errors.dueDate)}>
          {(control) => (
            <input
              {...control}
              className="input"
              type="date"
              min={today}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              onBlur={() => form.touch("dueDate")}
            />
          )}
        </FormField>
        <FormField id="projeto-prioridade" label={t("proj.field.priority")}>
          {(control) => (
            <select
              {...control}
              className="input"
              value={priority}
              onChange={(event) => setPriority(event.target.value as ProjectPriority)}
            >
              {PROJECT_PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {projectPriorityLabel(item)}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel}>
          {t("ui.cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("proj.create")}
        </button>
      </div>
    </form>
  );
}
