import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { clinicService } from "@/services/api";
import { formatPhone } from "@/lib/phone";
import {
  AppointmentFormFields,
  DEFAULT_SPECIES,
  DEFAULT_VET,
  createEmptyAppointmentForm,
  uniqueNames,
  validateAppointmentForm,
} from "./AppointmentForm";

/**
 * Página dedicada para edição de atendimento clínico (/clinica/agenda/editar/:id).
 * Substitui o antigo modal de edição da agenda por uma rota própria.
 */
const ClinicEditAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appointments, profile, updateAppointment } = useClinic();

  const appointment = useMemo(
    () => appointments.find((a) => String(a.id) === String(id)),
    [appointments, id],
  );

  const [form, setForm] = useState(createEmptyAppointmentForm);
  const [errors, setErrors] = useState({});
  const [speciesOptions, setSpeciesOptions] = useState(DEFAULT_SPECIES);

  const services = useMemo(() => uniqueNames(profile.services), [profile.services]);
  const team = useMemo(() => uniqueNames(profile.team), [profile.team]);

  useEffect(() => {
    let active = true;
    clinicService
      .getSpecies()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setSpeciesOptions(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!appointment) return;
    setForm({
      patientId: appointment.patientId || null,
      date: appointment.date || "",
      time: appointment.time || "",
      petName: appointment.petName || "",
      species: appointment.species || "Cão",
      breed: appointment.breed && appointment.breed !== "—" ? appointment.breed : "",
      tutor: appointment.tutor || "",
      phone: appointment.phone && appointment.phone !== "—" ? appointment.phone : "",
      service: appointment.service || "",
      vet: appointment.vet && appointment.vet !== DEFAULT_VET ? appointment.vet : "",
      priority: appointment.priority || "Rotina",
      notes: appointment.notes || "",
    });
  }, [appointment]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors(({ [key]: _removed, ...rest }) => rest);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!appointment) return;

    const found = validateAppointmentForm(form, services.length > 0);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    updateAppointment(appointment.id, {
      date: form.date,
      time: form.time,
      petName: form.petName.trim(),
      species: form.species,
      breed: form.breed.trim() || "—",
      tutor: form.tutor.trim(),
      phone: formatPhone(form.phone),
      service: form.service.trim(),
      vet: form.vet || DEFAULT_VET,
      priority: form.priority || "Rotina",
      notes: form.notes.trim() || "",
    });

    toast.success("Atendimento atualizado!");
    navigate("/clinica/agenda");
  };

  if (!appointment) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/clinica/agenda")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a agenda
        </Button>
        <Card className="p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h2 className="font-display text-xl font-bold">Atendimento não encontrado</h2>
          <p className="text-muted-foreground text-sm mt-1">
            O agendamento solicitado pode ter sido concluído, cancelado ou removido.
          </p>
          <Button
            className="mt-4 rounded-full"
            onClick={() => navigate("/clinica/agenda")}
          >
            Ir para a agenda
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/clinica/agenda")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a agenda
          </Button>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">
              Editar atendimento
            </Badge>
            <Badge variant="outline">{appointment.status}</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold">
            Editar atendimento: {appointment.petName}
          </h1>
          <p className="text-muted-foreground">
            Altere os dados da consulta, horário ou triagem.
          </p>
        </div>
      </div>

      <Card className="border-border/70 shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Edit3 className="h-5 w-5 text-primary" />
            Dados da consulta
          </CardTitle>
          <CardDescription>
            Tutor: {appointment.tutor} · Horário atual: {appointment.date} às {appointment.time}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentFormFields
            form={form}
            errors={errors}
            speciesOptions={speciesOptions}
            services={services}
            team={team}
            onUpdate={update}
            onSubmit={handleSubmit}
            submitLabel="Salvar alterações"
            onCancel={() => navigate("/clinica/agenda")}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicEditAppointment;

