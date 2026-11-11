import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPriorityMeta, PRIORITY_OPTIONS } from "@/data/clinicDemo";
import { formatPhone, isValidPhone } from "@/lib/phone";

export const DEFAULT_SPECIES = ["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"];
export const DEFAULT_VET = "Equipe da clínica";

export const getToday = () => new Date().toISOString().split("T")[0];

export const createEmptyAppointmentForm = () => ({
  patientId: null,
  petName: "",
  species: "",
  breed: "",
  date: getToday(),
  time: "",
  tutor: "",
  phone: "",
  service: "",
  vet: "",
  priority: "Rotina",
  notes: "",
});

// Serviços e equipe vêm do Perfil; aceita texto puro ou objeto com "name".
const toName = (item) => (typeof item === "string" ? item : item?.name);
export const uniqueNames = (items) => [...new Set((items || []).map(toName).filter(Boolean))];

// A ordem das chaves segue a ordem dos campos na tela (o primeiro erro recebe o foco).
export const validateAppointmentForm = (form, hasServices) => {
  const errors = {};
  if (!form.petName.trim()) errors.petName = "Informe o nome do pet.";
  if (!form.species) errors.species = "Selecione a espécie.";
  if (!form.date) errors.date = "Informe a data.";
  if (!form.time) errors.time = "Informe o horário.";
  if (!form.tutor.trim()) errors.tutor = "Informe o nome do tutor.";
  if (!form.phone.trim()) errors.phone = "Informe o telefone do tutor.";
  else if (!isValidPhone(form.phone)) {
    errors.phone = "Telefone inválido. Use DDD + número, ex.: (11) 99999-0000.";
  }
  if (!form.service.trim()) {
    errors.service = hasServices ? "Selecione o serviço." : "Informe o serviço.";
  }
  return errors;
};

const FieldError = ({ id, message }) =>
  message ? (
    <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;

const ProfileLink = ({ children }) => (
  <Link to="/clinica/perfil" className="font-medium text-primary underline-offset-4 hover:underline">
    {children}
  </Link>
);

export const PriorityBadge = ({ priority }) => {
  const meta = getPriorityMeta(priority);
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 border ${meta.badgeClass}`}
      title={`Classificação de Risco: ${meta.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </Badge>
  );
};

export const PrioritySelector = ({ value, onChange, idPrefix = "priority" }) => {
  const current = getPriorityMeta(value).value;
  return (
    <div
      role="radiogroup"
      aria-label="Classificação de Risco (Triagem)"
      className="grid grid-cols-2 gap-2"
    >
      {PRIORITY_OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            id={`${idPrefix}-${opt.value}`}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all ${
              active
                ? `${opt.badgeClass} ring-2 ring-primary/30 font-semibold shadow-sm`
                : "border-border bg-background text-muted-foreground hover:bg-muted/60"
            }`}
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${opt.dotClass}`} />
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Campos reutilizáveis do formulário de agendamento (criação em página dedicada e edição em modal).
 */
export const AppointmentFormFields = ({
  form,
  errors,
  speciesOptions,
  services,
  team,
  onUpdate,
  onSubmit,
  submitLabel = "Confirmar agendamento",
  onCancel,
}) => {
  const fieldProps = (key) => ({
    id: key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="petName">Pet</Label>
          <Input
            {...fieldProps("petName")}
            value={form.petName}
            onChange={(e) => onUpdate("petName", e.target.value)}
          />
          <FieldError id="petName" message={errors.petName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="species">Espécie</Label>
          <Select value={form.species} onValueChange={(v) => onUpdate("species", v)}>
            <SelectTrigger {...fieldProps("species")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {speciesOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="species" message={errors.species} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breed">Raça (opcional)</Label>
          <Input
            id="breed"
            value={form.breed}
            onChange={(e) => onUpdate("breed", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            {...fieldProps("date")}
            type="date"
            value={form.date}
            onChange={(e) => onUpdate("date", e.target.value)}
          />
          <FieldError id="date" message={errors.date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input
            {...fieldProps("time")}
            type="time"
            value={form.time}
            onChange={(e) => onUpdate("time", e.target.value)}
          />
          <FieldError id="time" message={errors.time} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tutor">Tutor</Label>
          <Input
            {...fieldProps("tutor")}
            value={form.tutor}
            onChange={(e) => onUpdate("tutor", e.target.value)}
          />
          <FieldError id="tutor" message={errors.tutor} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            {...fieldProps("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(11) 99999-0000"
            value={form.phone}
            onChange={(e) => onUpdate("phone", formatPhone(e.target.value))}
          />
          <FieldError id="phone" message={errors.phone} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-primary" />
          Classificação de Risco (Triagem)
        </Label>
        <PrioritySelector
          value={form.priority}
          onChange={(v) => onUpdate("priority", v)}
          idPrefix="schedule-priority"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="service">Serviço</Label>
        {services.length > 0 ? (
          <Select value={form.service} onValueChange={(v) => onUpdate("service", v)}>
            <SelectTrigger {...fieldProps("service")}>
              <SelectValue placeholder="Selecione o serviço" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              {...fieldProps("service")}
              placeholder="Consulta clínica"
              value={form.service}
              onChange={(e) => onUpdate("service", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nenhum serviço cadastrado.{" "}
              <ProfileLink>Cadastre serviços no Perfil da clínica</ProfileLink>.
            </p>
          </>
        )}
        <FieldError id="service" message={errors.service} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vet">Responsável</Label>
        {team.length > 0 ? (
          <Select value={form.vet} onValueChange={(v) => onUpdate("vet", v)}>
            <SelectTrigger id="vet">
              <SelectValue placeholder={DEFAULT_VET} />
            </SelectTrigger>
            <SelectContent>
              {team.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input id="vet" value={DEFAULT_VET} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              <ProfileLink>Cadastre a equipe no Perfil da clínica</ProfileLink> para escolher
              o responsável.
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações / Queixa principal (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Ex.: Consulta de rotina, vacinação anual, tosse seca há 2 dias..."
          rows={2}
          value={form.notes}
          onChange={(e) => onUpdate("notes", e.target.value)}
        />
      </div>

      <div className={onCancel ? "flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end" : ""}>
        {onCancel && (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className={`${onCancel ? "sm:min-w-[200px]" : "w-full"} rounded-full gradient-primary text-primary-foreground`}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

