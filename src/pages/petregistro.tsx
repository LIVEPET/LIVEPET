import React, { useState } from 'react';

export default function PetRegister() {
  const [formData, setFormData] = useState({
    nome: '',
    especie: 'Cachorro',
    raca: '',
    idade: '',
    nomeTutor: '',
    telefoneTutor: '',
    alertaMedico: ''
  });

  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dados do Pet e Tutor salvos:', formData);
    setMensagemSucesso(true);
    setTimeout(() => setMensagemSucesso(false), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md border border-slate-200 font-sans">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Cadastro de Pet e Tutor</h2>
        <p className="text-sm text-slate-500 mt-1">
          Insira as informações vitais para a identificação digital e carteira de saúde.
        </p>
      </div>

      {mensagemSucesso && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
          <span>✓</span> Pet cadastrado com sucesso! Pronto para gerar o QR Code.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bloco: Informações do Animal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Nome do Pet *
            </label>
            <input
              type="text"
              name="nome"
              required
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Thor"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Espécie *
            </label>
            <select
              name="especie"
              value={formData.especie}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Cachorro">Cachorro</option>
              <option value="Gato">Gato</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Raça
            </label>
            <input
              type="text"
              name="raca"
              value={formData.raca}
              onChange={handleChange}
              placeholder="Ex: Golden Retriever"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Idade (anos)
            </label>
            <input
              type="number"
              name="idade"
              min="0"
              value={formData.idade}
              onChange={handleChange}
              placeholder="Ex: 3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Bloco: Informações do Tutor */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Contato de Emergência</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Nome do Tutor *
              </label>
              <input
                type="text"
                name="nomeTutor"
                required
                value={formData.nomeTutor}
                onChange={handleChange}
                placeholder="Ex: Carlos Silva"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="tel"
                name="telefoneTutor"
                required
                value={formData.telefoneTutor}
                onChange={handleChange}
                placeholder="(62) 99999-0000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Bloco: Alertas de Saúde */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Alergias ou Cuidados Médicos Urgentes
          </label>
          <textarea
            name="alertaMedico"
            rows={2}
            value={formData.alertaMedico}
            onChange={handleChange}
            placeholder="Ex: Alérgico a dipirona; faz uso contínuo de insulina..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition duration-150 cursor-pointer"
        >
          Salvar Cadastro do Pet
        </button>
      </form>
    </div>
  );
}