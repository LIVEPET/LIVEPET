import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  buildHour,
  hoursForEditing,
  isDuplicateName,
  normalizeMember,
  normalizeService,
  parseDuration,
  parsePrice,
  validateHours,
} from "@/lib/clinicProfile";

const FieldError = ({ id, message }) =>
  message ? (
    <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;

const fieldProps = (id, error) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : undefined,
});

const focusFirst = (ids) => document.getElementById(ids[0])?.focus();

const emptyService = { name: "", duration: "", price: "" };

export const ServiceDialog = ({ open, onOpenChange, service, services, onSave }) => {
  const [form, setForm] = useState(emptyService);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (service) {
      const current = normalizeService(service);
      setForm({
        name: current.name,
        duration: current.duration == null ? "" : String(current.duration),
        price: current.price == null ? "" : current.price.toFixed(2).replace(".", ","),
      });
    } else {
      setForm(emptyService);
    }
    setErrors({});
  }, [open, service]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors(({ [key]: _removed, ...rest }) => rest);
  };

  const submit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const duration = parseDuration(form.duration);
    const price = parsePrice(form.price);
    const found = {};
    if (!name) found.name = "Informe o nome do serviço.";
    else if (isDuplicateName(services, name, service, normalizeService)) {
      found.name = "Já existe um serviço com esse nome.";
    }
    if (Number.isNaN(duration)) found.duration = "Use um número inteiro de minutos, de 1 a 1440.";
    if (Number.isNaN(price)) found.price = "Preço inválido. Use o formato 80,00.";
    if (Object.keys(found).length > 0) {
      setErrors(found);
      focusFirst(Object.keys(found).map((key) => `service-${key}`));
      return;
    }
    onSave({ name, duration, price }, service);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {service ? "Editar serviço" : "Adicionar serviço"}
          </DialogTitle>
          <DialogDescription>
            Esses serviços aparecem como opções ao agendar um atendimento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Nome do serviço</Label>
            <Input
              {...fieldProps("service-name", errors.name)}
              placeholder="Consulta clínica"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <FieldError id="service-name" message={errors.name} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-duration">Duração (minutos)</Label>
              <Input
                {...fieldProps("service-duration", errors.duration)}
                inputMode="numeric"
                placeholder="30"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
              <FieldError id="service-duration" message={errors.duration} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Preço (R$)</Label>
              <Input
                {...fieldProps("service-price", errors.price)}
                inputMode="decimal"
                placeholder="80,00"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
              <FieldError id="service-price" message={errors.price} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              Salvar serviço
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const emptyMember = { name: "", role: "", crmv: "", phone: "", email: "" };

export const TeamDialog = ({ open, onOpenChange, member, team, onSave }) => {
  const [form, setForm] = useState(emptyMember);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(member ? { ...emptyMember, ...normalizeMember(member) } : emptyMember);
    setErrors({});
  }, [open, member]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors(({ [key]: _removed, ...rest }) => rest);
  };

  const submit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setErrors({ name: "Informe o nome do profissional." });
      focusFirst(["member-name"]);
      return;
    }
    if (isDuplicateName(team, name, member, normalizeMember)) {
      setErrors({ name: "Já existe um profissional com esse nome." });
      focusFirst(["member-name"]);
      return;
    }
    const nextMember = {
      name,
      role: (form.role || "").trim(),
      crmv: (form.crmv || "").trim(),
    };
    if (member?.id != null) nextMember.id = member.id;
    if (form.phone?.trim()) nextMember.phone = form.phone.trim();
    if (form.email?.trim()) nextMember.email = form.email.trim();
    onSave(nextMember, member);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {member ? "Editar profissional" : "Adicionar profissional"}
          </DialogTitle>
          <DialogDescription>
            Os profissionais cadastrados aparecem como responsáveis ao agendar um atendimento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">Nome do profissional</Label>
            <Input
              {...fieldProps("member-name", errors.name)}
              placeholder="Dra. Marina Alves"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <FieldError id="member-name" message={errors.name} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-role">Função</Label>
              <Input
                id="member-role"
                placeholder="Ex.: Cirurgia, Clínica Geral"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-crmv">CRMV</Label>
              <Input
                {...fieldProps("member-crmv", errors.crmv)}
                placeholder="SP-12345"
                value={form.crmv}
                onChange={(e) => update("crmv", e.target.value)}
              />
              <FieldError id="member-crmv" message={errors.crmv} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-phone">Telefone (opcional)</Label>
              <Input
                id="member-phone"
                placeholder="(11) 98765-4321"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">E-mail (opcional)</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="vet@clinica.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              Salvar profissional
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const HoursDialog = ({ open, onOpenChange, hours, onSave }) => {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setRows(hoursForEditing(hours));
    setErrors({});
  }, [open, hours]);

  const updateRow = (day, patch) => {
    setRows((current) => current.map((row) => (row.day === day ? { ...row, ...patch } : row)));
    setErrors(({ [day]: _removed, ...rest }) => rest);
  };

  const toggle = (row, open) =>
    updateRow(row.day, open && !row.from ? { open, from: "08:00", to: "18:00" } : { open });

  const submit = (e) => {
    e.preventDefault();
    const found = validateHours(rows);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      focusFirst(Object.keys(found).map((day) => `hours-${day}-from`));
      return;
    }
    onSave(rows.map((row) => buildHour(row.day, row.open, row.from, row.to)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Horários de atendimento</DialogTitle>
          <DialogDescription>
            Marque os dias em que a clínica atende e defina a abertura e o fechamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-3">
          {rows.map((row) => (
            <div key={row.day} className="space-y-1">
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-3 py-2">
                <span className="w-10 text-sm font-semibold">{row.day}</span>
                <Switch
                  checked={row.open}
                  onCheckedChange={(next) => toggle(row, next)}
                  aria-label={`Aberto ${row.day}`}
                />
                <span className="w-14 text-xs text-muted-foreground">
                  {row.open ? "Aberto" : "Fechado"}
                </span>
                <Input
                  {...fieldProps(`hours-${row.day}-from`, errors[row.day])}
                  type="time"
                  aria-label={`Abertura ${row.day}`}
                  className="h-9 w-28"
                  disabled={!row.open}
                  value={row.from}
                  onChange={(e) => updateRow(row.day, { from: e.target.value })}
                />
                <span className="text-xs text-muted-foreground">às</span>
                <Input
                  id={`hours-${row.day}-to`}
                  type="time"
                  aria-label={`Fechamento ${row.day}`}
                  className="h-9 w-28"
                  disabled={!row.open}
                  value={row.to}
                  onChange={(e) => updateRow(row.day, { to: e.target.value })}
                />
              </div>
              <FieldError id={`hours-${row.day}-from`} message={errors[row.day]} />
            </div>
          ))}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              Salvar horários
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ConfirmRemoveDialog = ({ open, onOpenChange, title, description, onConfirm }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Remover
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
