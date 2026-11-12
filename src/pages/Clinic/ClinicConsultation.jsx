import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileBadge,
  FileText,
  Heart,
  Stethoscope,
  Syringe,
  Thermometer,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/contexts/ClinicContext";
import { getPriorityMeta, statusStyles } from "@/data/clinicDemo";
import { PAYMENT_STATUS, calculateAppointmentTotal, findServicePrice } from "@/lib/clinicBilling";
import { addDaysToIsoDate, formatIsoDateBR } from "@/lib/clinicReturn";
import { AppointmentBillingSection } from "./AppointmentBillingSection";
import {
  DEFAULT_VET,
  PriorityBadge,
  PrioritySelector,
  getToday,
} from "./AppointmentForm";
import { ComplementaryExamsSelector } from "./ClinicExams";
import { PrescriptionBuilder } from "./ClinicPrescription";
import { ReturnSchedulingSection } from "./ClinicReturnAndWhatsapp";

/**
 * Página dedicada para Atendimento Clínico & Anamnese (/clinica/atendimento/:id).
 * Substitui o antigo modal de atendimento clínico por uma rota completa em tela cheia.
 */
const ClinicConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    appointments,
    profile,
    updateAppointmentStatus,
    updateAppointmentPriority,
    concludeAppointment,
    addAppointment,
  } = useClinic();

  const appointment = useMemo(
    () => appointments.find((a) => String(a.id) === String(id)),
    [appointments, id],
  );

  const [examForm, setExamForm] = useState({
    priority: "Rotina",
    queixa_principal: "",
    temperatura: "",
    peso: "",
    frequencia_cardiaca: "",
    frequencia_respiratoria: "",
    mucosas: "Normocoradas",
    diagnostico: "",
    prescricao: "",
    prescricao_itens: [],
    exames_complementares: [],
    applyVaccine: false,
    vacina_aplicada: "",
    vacina_lote: "",
    vacina_proxima_dose: "",
    valor_servico: 0,
    itens_adicionais: [],
    desconto: 0,
    status_pagamento: PAYMENT_STATUS.PAID,
    forma_pagamento: "PIX",
    scheduleReturn: false,
    returnDate: addDaysToIsoDate(getToday(), 7),
    returnTime: "10:00",
    returnReason: "",
  });

  useEffect(() => {
    if (!appointment) return;

    setExamForm({
      priority: getPriorityMeta(appointment.priority).value,
      queixa_principal: appointment.queixa_principal || appointment.notes || "",
      temperatura: appointment.temperatura != null ? String(appointment.temperatura) : "",
      peso: appointment.peso != null ? String(appointment.peso) : "",
      frequencia_cardiaca:
        appointment.frequencia_cardiaca != null ? String(appointment.frequencia_cardiaca) : "",
      frequencia_respiratoria:
        appointment.frequencia_respiratoria != null ? String(appointment.frequencia_respiratoria) : "",
      mucosas: appointment.mucosas || "Normocoradas",
      diagnostico: appointment.diagnostico || "",
      prescricao: appointment.prescricao || "",
      prescricao_itens: Array.isArray(appointment.prescricao_itens) ? appointment.prescricao_itens : [],
      exames_complementares: Array.isArray(appointment.exames_complementares)
        ? appointment.exames_complementares
        : [],
      applyVaccine: !!appointment.vacina_aplicada,
      vacina_aplicada: appointment.vacina_aplicada || "",
      vacina_lote: appointment.vacina_lote || "",
      vacina_proxima_dose: appointment.vacina_proxima_dose || "",
      valor_servico:
        appointment.valor_servico != null
          ? Number(appointment.valor_servico)
          : findServicePrice(appointment.service, profile.services) || 0,
      itens_adicionais: Array.isArray(appointment.itens_adicionais) ? appointment.itens_adicionais : [],
      desconto: appointment.desconto != null ? Number(appointment.desconto) : 0,
      status_pagamento: appointment.status_pagamento || PAYMENT_STATUS.PAID,
      forma_pagamento: appointment.forma_pagamento || "PIX",
      scheduleReturn: false,
      returnDate: addDaysToIsoDate(appointment.date || getToday(), 7),
      returnTime: appointment.time || "10:00",
      returnReason: "",
    });

    if (appointment.status === "Confirmado" || appointment.status === "Aguardando") {
      updateAppointmentStatus(appointment.id, "Em atendimento");
      toast.success(`${appointment.petName}: atendimento iniciado`);
    }
  }, [appointment, profile.services, updateAppointmentStatus]);

  const handlePriorityChange = (nextPriority) => {
    setExamForm((f) => ({ ...f, priority: nextPriority }));
    if (appointment && updateAppointmentPriority) {
      updateAppointmentPriority(appointment.id, nextPriority);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!appointment) return;

    if (examForm.applyVaccine && !examForm.vacina_aplicada.trim()) {
      toast.error("Informe o nome da vacina aplicada ou desmarque a opção.");
      return;
    }

    const payload = {
      priority: examForm.priority || "Rotina",
      queixa_principal: examForm.queixa_principal.trim() || null,
      temperatura: examForm.temperatura ? parseFloat(examForm.temperatura) : null,
      peso: examForm.peso ? parseFloat(examForm.peso) : null,
      frequencia_cardiaca: examForm.frequencia_cardiaca ? parseInt(examForm.frequencia_cardiaca, 10) : null,
      frequencia_respiratoria: examForm.frequencia_respiratoria ? parseInt(examForm.frequencia_respiratoria, 10) : null,
      mucosas: examForm.mucosas || "Normocoradas",
      diagnostico: examForm.diagnostico.trim() || null,
      prescricao: examForm.prescricao.trim() || null,
      prescricao_itens: Array.isArray(examForm.prescricao_itens) ? examForm.prescricao_itens : [],
      exames_complementares: Array.isArray(examForm.exames_complementares) ? examForm.exames_complementares : [],
      vacina_aplicada: examForm.applyVaccine && examForm.vacina_aplicada.trim() ? examForm.vacina_aplicada.trim() : null,
      vacina_lote: examForm.applyVaccine && examForm.vacina_lote.trim() ? examForm.vacina_lote.trim() : null,
      vacina_proxima_dose: examForm.applyVaccine && examForm.vacina_proxima_dose ? examForm.vacina_proxima_dose : null,
      valor_servico: Number(examForm.valor_servico) || 0,
      itens_adicionais: Array.isArray(examForm.itens_adicionais) ? examForm.itens_adicionais : [],
      desconto: Number(examForm.desconto) || 0,
      valor_total: calculateAppointmentTotal({
        basePrice: examForm.valor_servico,
        extraItems: examForm.itens_adicionais,
        discount: examForm.desconto,
      }),
      status_pagamento: examForm.status_pagamento || PAYMENT_STATUS.PAID,
      forma_pagamento: examForm.forma_pagamento || "PIX",
    };

    concludeAppointment(appointment.id, payload);

    if (examForm.scheduleReturn && examForm.returnDate) {
      const returnServiceName = "Retorno Clínico";
      const returnPrice = findServicePrice(returnServiceName, profile.services) || 0;
      addAppointment({
        patientId: appointment.patientId || null,
        date: examForm.returnDate,
        time: examForm.returnTime || appointment.time || "10:00",
        petName: appointment.petName,
        species: appointment.species || "Cão",
        breed: appointment.breed || "—",
        tutor: appointment.tutor,
        phone: appointment.phone || "—",
        service: returnServiceName,
        isReturn: true,
        valor_servico: returnPrice,
        valor_total: returnPrice,
        status_pagamento: PAYMENT_STATUS.PENDING,
        forma_pagamento: "PIX",
        vet: appointment.vet || DEFAULT_VET,
        priority: "Rotina",
        notes:
          examForm.returnReason.trim() ||
          `Retorno referente ao atendimento de ${appointment.service}`,
      });
      toast.success(
        `Retorno clínico de ${appointment.petName} agendado para ${formatIsoDateBR(examForm.returnDate)} às ${examForm.returnTime || "10:00"}!`,
      );
    }

    toast.success(`Atendimento de ${appointment.petName} concluído com sucesso! Prontuário registrado.`);
    navigate("/clinica/agenda");
  };

  if (!appointment) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
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
            O agendamento solicitado pode não existir ou já foi finalizado.
          </p>
          <Button className="mt-4 rounded-full" onClick={() => navigate("/clinica/agenda")}>
            Ir para a agenda
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Navegação e Cabeçalho do Paciente */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={examForm.priority} />
          <Badge className={`${statusStyles[appointment.status]} text-xs`}>
            {appointment.status}
          </Badge>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-soft">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Atendimento Clínico & Anamnese
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            <span className="font-semibold text-foreground">{appointment.petName}</span> (
            {appointment.species} · {appointment.breed}) · Tutor(a):{" "}
            <span className="font-medium text-foreground">{appointment.tutor}</span> · Horário:{" "}
            {appointment.date} às {appointment.time}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 0. Classificação de Risco (Triagem Veterinária) */}
        <Card className="border-border/70 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-4 w-4 text-primary" /> Classificação de Risco (Triagem Veterinária)
            </CardTitle>
            <CardDescription>
              Defina a gravidade do quadro para priorização e registros de emergência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrioritySelector
              value={examForm.priority}
              onChange={handlePriorityChange}
              idPrefix="consultation-priority"
            />
          </CardContent>
        </Card>

        {/* 1. Anamnese / Queixa Principal */}
        <Card className="border-border/70 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-primary" /> Anamnese & Queixa Principal
            </CardTitle>
            <CardDescription>
              Relato fornecido pelo tutor no início da consulta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="queixa"
              rows={3}
              placeholder="Motivo da consulta, sintomas, duração, alterações de apetite, fezes ou comportamento..."
              value={examForm.queixa_principal}
              onChange={(e) => setExamForm((f) => ({ ...f, queixa_principal: e.target.value }))}
            />
          </CardContent>
        </Card>

        {/* 2. Sinais Vitais & Exame Físico */}
        <Card className="border-border/70 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Thermometer className="h-4 w-4 text-primary" /> Sinais Vitais e Avaliação Física
            </CardTitle>
            <CardDescription>
              Parâmetros vitais aferidos em mesa clínica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="peso" className="text-xs font-semibold">
                  Peso Atual (kg)
                </Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 12.5"
                  value={examForm.peso}
                  onChange={(e) => setExamForm((f) => ({ ...f, peso: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="temp" className="text-xs font-semibold">
                  Temperatura Retal (°C)
                </Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 38.5"
                  value={examForm.temperatura}
                  onChange={(e) => setExamForm((f) => ({ ...f, temperatura: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Ref: Cães 37.5–39.2 °C | Gatos 38.0–39.2 °C
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fc" className="text-xs font-medium">
                  Frequência Cardíaca (bpm) <span className="text-muted-foreground text-[10px]">(opcional)</span>
                </Label>
                <Input
                  id="fc"
                  type="number"
                  placeholder="Ex: 110"
                  value={examForm.frequencia_cardiaca}
                  onChange={(e) => setExamForm((f) => ({ ...f, frequencia_cardiaca: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Ref: Cães 70–160 | Gatos 140–220 bpm
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fr" className="text-xs font-medium">
                  Frequência Respiratória (mpm) <span className="text-muted-foreground text-[10px]">(opcional)</span>
                </Label>
                <Input
                  id="fr"
                  type="number"
                  placeholder="Ex: 24"
                  value={examForm.frequencia_respiratoria}
                  onChange={(e) => setExamForm((f) => ({ ...f, frequencia_respiratoria: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">Ref: 15–35 mpm</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="mucosas" className="text-xs font-medium">
                Coloração das Mucosas
              </Label>
              <Select
                value={examForm.mucosas}
                onValueChange={(v) => setExamForm((f) => ({ ...f, mucosas: v }))}
              >
                <SelectTrigger id="mucosas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normocoradas">Normocoradas (róseas saudáveis)</SelectItem>
                  <SelectItem value="Pálidas">Pálidas (suspeita de anemia/choque)</SelectItem>
                  <SelectItem value="Congestas / Hiperêmicas">Congestas / Hiperêmicas (avermelhadas/febre)</SelectItem>
                  <SelectItem value="Ictéricas">Ictéricas (amareladas/hepático)</SelectItem>
                  <SelectItem value="Cianóticas">Cianóticas (azuladas/hipóxia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 3. Diagnóstico e Prescrição Estruturada */}
        <Card className="border-border/70 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Heart className="h-4 w-4 text-primary" /> Diagnóstico & Conduta Clínica
            </CardTitle>
            <CardDescription>
              Diagnóstico presuntivo/definitivo e prescrição médica detalhada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="diagnostico" className="text-xs font-semibold">
                Diagnóstico Clínico / Avaliação
              </Label>
              <Textarea
                id="diagnostico"
                rows={2}
                placeholder="Diagnóstico provisório ou definitivo e achados do exame físico..."
                value={examForm.diagnostico}
                onChange={(e) => setExamForm((f) => ({ ...f, diagnostico: e.target.value }))}
              />
            </div>

            <PrescriptionBuilder
              items={examForm.prescricao_itens}
              onChangeItems={(nextItems) =>
                setExamForm((f) => ({ ...f, prescricao_itens: nextItems }))
              }
              notes={examForm.prescricao}
              onChangeNotes={(nextNotes) =>
                setExamForm((f) => ({ ...f, prescricao: nextNotes }))
              }
              onOpenPreview={() => navigate(`/clinica/prescricao/${appointment.id}`)}
            />
          </CardContent>
        </Card>

        {/* 4. Exames Complementares */}
        <ComplementaryExamsSelector
          exams={examForm.exames_complementares}
          onChangeExams={(nextExams) =>
            setExamForm((f) => ({ ...f, exames_complementares: nextExams }))
          }
        />

        {/* 5. Vacinação Aplicada na Consulta */}
        <Card className="border-border/70 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="applyVaccineToggle"
                className="flex cursor-pointer items-center gap-2 text-sm font-semibold"
              >
                <Syringe className="h-4 w-4 text-primary" />
                Aplicar Vacina neste atendimento
              </Label>
              <input
                id="applyVaccineToggle"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                checked={examForm.applyVaccine}
                onChange={(e) => setExamForm((f) => ({ ...f, applyVaccine: e.target.checked }))}
              />
            </div>

            {examForm.applyVaccine && (
              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="vacNome" className="text-xs">
                    Nome da Vacina
                  </Label>
                  <Input
                    id="vacNome"
                    placeholder="Ex: V10 Polivalente"
                    value={examForm.vacina_aplicada}
                    onChange={(e) => setExamForm((f) => ({ ...f, vacina_aplicada: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vacLote" className="text-xs">
                    Lote
                  </Label>
                  <Input
                    id="vacLote"
                    placeholder="Ex: LT-2026-X"
                    value={examForm.vacina_lote}
                    onChange={(e) => setExamForm((f) => ({ ...f, vacina_lote: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vacProx" className="text-xs">
                    Próxima Dose / Reforço
                  </Label>
                  <Input
                    id="vacProx"
                    type="date"
                    value={examForm.vacina_proxima_dose}
                    onChange={(e) => setExamForm((f) => ({ ...f, vacina_proxima_dose: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. Programar Retorno / Reavaliação */}
        <ReturnSchedulingSection
          baseDate={appointment.date || getToday()}
          enabled={examForm.scheduleReturn}
          onToggleEnabled={(checked) =>
            setExamForm((f) => ({ ...f, scheduleReturn: checked }))
          }
          returnDate={examForm.returnDate}
          onChangeReturnDate={(d) => setExamForm((f) => ({ ...f, returnDate: d }))}
          returnTime={examForm.returnTime}
          onChangeReturnTime={(t) => setExamForm((f) => ({ ...f, returnTime: t }))}
          returnReason={examForm.returnReason}
          onChangeReturnReason={(r) => setExamForm((f) => ({ ...f, returnReason: r }))}
        />

        {/* 7. Orçamento, Procedimentos Extras & Pagamento */}
        <AppointmentBillingSection
          serviceName={appointment.service}
          basePrice={examForm.valor_servico}
          onChangeBasePrice={(v) => setExamForm((f) => ({ ...f, valor_servico: v }))}
          extraItems={examForm.itens_adicionais}
          onChangeExtraItems={(items) => setExamForm((f) => ({ ...f, itens_adicionais: items }))}
          discount={examForm.desconto}
          onChangeDiscount={(d) => setExamForm((f) => ({ ...f, desconto: d }))}
          paymentStatus={examForm.status_pagamento}
          onChangePaymentStatus={(st) => setExamForm((f) => ({ ...f, status_pagamento: st }))}
          paymentMethod={examForm.forma_pagamento}
          onChangePaymentMethod={(m) => setExamForm((f) => ({ ...f, forma_pagamento: m }))}
        />

        {/* Ações Finais */}
        <div className="flex flex-col-reverse justify-end gap-3 pt-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 rounded-full"
            onClick={() => navigate(`/clinica/documentos/${appointment.id}`)}
          >
            <FileBadge className="h-4 w-4 text-primary" />
            Emitir Atestado / Termo / Declaração
          </Button>

          <Button
            type="button"
            variant="outline"
            className="gap-1.5 rounded-full"
            onClick={() => navigate(`/clinica/prescricao/${appointment.id}`)}
          >
            <FileText className="h-4 w-4 text-primary" />
            Receituário Timbrado
          </Button>

          <Button
            type="submit"
            className="gap-2 rounded-full gradient-primary text-primary-foreground shadow-soft"
          >
            <CheckCircle2 className="h-4 w-4" />
            Concluir e registrar no prontuário
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClinicConsultation;

