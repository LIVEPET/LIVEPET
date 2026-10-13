import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// O Select do Radix usa APIs que o jsdom não tem; sem estes stubs ele quebra nos testes.
export const stubRadixForJsdom = () => {
  const proto = window.HTMLElement.prototype;
  if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
  if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
  if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
  if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
};

export const chooseOption = async (label, option) => {
  await userEvent.click(screen.getByLabelText(label));
  await userEvent.click(await screen.findByRole("option", { name: option }));
};

export const openNewAppointment = async () => {
  await userEvent.click(screen.getAllByRole("button", { name: /Novo atendimento/ })[0]);
  await screen.findByLabelText("Horário");
};

// Preenche o modal "Novo atendimento". Passe service: null para pular o serviço.
export const fillAppointmentForm = async ({
  pet = "Thor",
  species = "Cão",
  breed = "",
  tutor = "Ana",
  phone = "11999990000",
  service = "Consulta",
  time = "09:00",
} = {}) => {
  fireEvent.change(await screen.findByLabelText("Horário"), { target: { value: time } });
  await userEvent.type(screen.getByLabelText("Pet"), pet);
  await chooseOption("Espécie", species);
  if (breed) await userEvent.type(screen.getByLabelText(/^Raça/), breed);
  await userEvent.type(screen.getByLabelText("Tutor"), tutor);
  await userEvent.type(screen.getByLabelText("Telefone"), phone);
  if (service) await userEvent.type(screen.getByLabelText("Serviço"), service);
};