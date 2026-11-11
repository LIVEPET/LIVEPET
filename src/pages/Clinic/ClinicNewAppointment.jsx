import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { clinicService } from "@/services/api";
import { formatPhone } from "@/lib/phone";
import { PAYMENT_STATUS, findServicePrice } from "@/lib/clinicBilling";
import {
  AppointmentFormFields,
  DEFAULT_SPECIES,
  DEFAULT_VET,
  createEmptyAppointmentForm,
  uniqueNames,
  validateAppointmentForm,
} from "./AppointmentForm";

/**
 * Página dedicada para cadastro de novo atendimento clínico (/clinica/agenda/novo).
 */
const ClinicNewAppointment = () => {
  const { profile, addAppointment } = useClinic();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Pré-preenche dados quando o usuário vem da aba de Pacientes
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;
    setForm((current) => ({
      ...current,
      patientId: prefill.patientId || null,
      petName: prefill.petName || current.petName,
      species: prefill.species || current.species,
      breed: prefill.breed || current.breed,
      tutor: prefill.tutor || current.tutor,
      phone: prefill.phone || current.phone,
      priority: prefill.priority || current.priority || "Rotina",
    }));
  }, [location.state]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors(({ [key]: _removed, ...rest }) => rest);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validateAppointmentForm(form, services.length > 0);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    const servicePrice = findServicePrice(form.service, profile.services) || 0;
    addAppointment({
      patientId: form.patientId || null,
      date: form.date,
      time: form.time,
      petName: form.petName.trim(),
      species: form.species,
      breed: form.breed.trim() || "—",
      tutor: form.tutor.trim(),
      phone: formatPhone(form.phone),
      service: form.service.trim(),
      valor_servico: servicePrice,
      valor_total: servicePrice,
      status_pagamento: PAYMENT_STATUS.PENDING,
      forma_pagamento: "PIX",
      vet: form.vet || DEFAULT_VET,
      priority: form.priority || "Rotina",
      notes: form.notes.trim() || "",
    });

    toast.success("Atendimento agendado!");
    navigate("/clinica/agenda");
  };

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
          <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">
            Novo atendimento
          </Badge>
          <h1 className="font-display text-3xl font-bold">Agendar atendimento</h1>
          <p className="text-muted-foreground">
            Preencha os dados da consulta e a triagem de risco.
          </p>
        </div>
      </div>

      <Card className="border-border/70 shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Dados do agendamento
          </CardTitle>
          <CardDescription>
            Após confirmar, o atendimento aparecerá imediatamente na agenda da clínica.
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
            submitLabel="Confirmar agendamento"
            onCancel={() => navigate("/clinica/agenda")}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicNewAppointment;

