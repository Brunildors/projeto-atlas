import { useState } from "react";
import { FormField } from "../../components/FormField";
import { t } from "../../i18n";
import { useTouched } from "../../components/useTouched";
import { formatFileSize } from "../../lib/format";
import {
  PROJECT_FILE_DESCRIPTION_MAX_LENGTH,
  PROJECT_FILE_MAX_BYTES,
  PROJECT_FILE_NAME_MAX_LENGTH,
  projectFileDescriptionError,
  projectFileError,
  projectFileNameError,
  suggestedName,
} from "../../lib/projectFiles";

type Field = "file" | "name" | "description";

export interface FileDraft {
  name: string;
  description: string;
  file: File;
}

interface FileFormProps {
  onSave: (draft: FileDraft) => Promise<boolean>;
  onCancel: () => void;
}

export function FileForm({ onSave, onCancel }: FileFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useTouched<Field>();

  const errors: Record<Field, string | null> = {
    file: projectFileError(file),
    name: projectFileNameError(name),
    description: projectFileDescriptionError(description),
  };

  function chooseFile(next: File | null) {
    setFile(next);
    form.touch("file");
    if (next && name.trim() === "") setName(suggestedName(next.name));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.submit();
    setFormError(null);

    if (!file || Object.values(errors).some(Boolean)) return;

    setSaving(true);
    const saved = await onSave({ name, description, file });
    setSaving(false);

    if (!saved) {
      setFormError(t("file.err.save"));
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="arquivo-conteudo"
        label={t("file.field.file")}
        flag="required"
        hint={file ? `${file.name} · ${formatFileSize(file.size)}` : t("file.hint.any", { size: formatFileSize(PROJECT_FILE_MAX_BYTES) })}
        error={form.shown("file", errors.file)}
      >
        {(control) => (
          <input
            {...control}
            data-autofocus
            className="input input--file"
            type="file"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />
        )}
      </FormField>
      <FormField id="arquivo-nome" label={t("proj.field.name")} flag="required" error={form.shown("name", errors.name)}>
        {(control) => (
          <input
            {...control}
            className="input"
            type="text"
            maxLength={PROJECT_FILE_NAME_MAX_LENGTH}
            placeholder={t("file.namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => form.touch("name")}
          />
        )}
      </FormField>
      <FormField
        id="arquivo-descricao"
        label={t("proj.field.description")}
        flag="required"
        hint={t("file.descriptionHint")}
        error={form.shown("description", errors.description)}
      >
        {(control) => (
          <textarea
            {...control}
            className="input textarea"
            rows={3}
            maxLength={PROJECT_FILE_DESCRIPTION_MAX_LENGTH}
            placeholder={t("file.descriptionPlaceholder")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => form.touch("description")}
          />
        )}
      </FormField>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel}>
          {t("ui.cancel")}
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? t("file.saving") : t("file.save")}
        </button>
      </div>
    </form>
  );
}
