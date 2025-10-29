// Fechar mês: calcula entradas/saídas do mês atual, salva resumo e zera transações
(function () {
  // formatação BRL
  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function calcularTotaisDoMes(transacoes, ano, mes) {
    let entradas = 0;
    let saidas = 0;
    transacoes.forEach(t => {
      if (!t.data) return;
      const d = new Date(t.data);
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        if (t.tipo === 'entrada') entradas += Number(t.valor) || 0;
        if (t.tipo === 'saida') saidas += Number(t.valor) || 0;
      }
    });
    return { entradas, saidas };
  }

  function criarModalResumo(resumo) {
    // remove modal antigo se existir
    const existente = document.getElementById('modalFecharMes');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.id = 'modalFecharMes';
    modal.style = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);z-index:9999;`;

    const box = document.createElement('div');
    box.style = `background:#0f1724;color:#e6eef8;padding:20px;border-radius:8px;max-width:520px;width:90%;box-shadow:0 6px 30px rgba(0,0,0,0.6);`;

    box.innerHTML = `
      <h2 style="margin-top:0">Fechamento: ${resumo.mesLabel}</h2>
      <p><strong>Entradas:</strong> ${formatCurrency(resumo.entradas)}</p>
      <p><strong>Saídas:</strong> ${formatCurrency(resumo.saidas)}</p>
      <p><strong>Saldo antes do fechamento:</strong> ${formatCurrency(resumo.saldoAntes)}</p>
      <p><strong>Saldo após fechamento (carryover):</strong> ${formatCurrency(resumo.saldoDepois)}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
        <button id="fecharMesClose" style="padding:8px 12px;border-radius:6px;border:0;background:#2196f3;color:#fff;">OK</button>
      </div>
    `;

    modal.appendChild(box);
    document.body.appendChild(modal);

    document.getElementById('fecharMesClose').addEventListener('click', () => {
      modal.remove();
    });
  }

  function fecharMesHandler() {
    const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
    if (!transacoes || transacoes.length === 0) {
      alert('Nenhuma transação registrada para fechar.');
      return;
    }

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    const { entradas, saidas } = calcularTotaisDoMes(transacoes, ano, mes);

    // resumo atual (saldo exibido)
    const resumoAtual = JSON.parse(localStorage.getItem('resumoFinanceiro')) || { saldo: 0, entradas: 0, saidas: 0 };

    // Salva o fechamento
    const fechamentos = JSON.parse(localStorage.getItem('fechamentos')) || [];
    const mesLabel = `${ano}-${String(mes + 1).padStart(2, '0')}`;
    const fechamento = {
      mes: mesLabel,
      entradas,
      saidas,
      saldoAntes: resumoAtual.saldo || 0,
      fechadoEm: new Date().toISOString()
    };
    fechamento.saldoDepois = fechamento.saldoAntes; // ao zerar transações o saldo carryover permanece
    fechamentos.push(fechamento);
    localStorage.setItem('fechamentos', JSON.stringify(fechamentos));

    // Zera transações e atualiza saldo inicial para o carryover (saldo atual)
    localStorage.setItem('transacoes', JSON.stringify([]));
    localStorage.setItem('saldoInicial', String(fechamento.saldoDepois));

    // Atualiza resumoFinanceiro para o novo estado (entradas/saidas = 0, saldo = carryover)
    const novoResumo = { saldo: fechamento.saldoDepois, entradas: 0, saidas: 0 };
    localStorage.setItem('resumoFinanceiro', JSON.stringify(novoResumo));

    // Exibe modal com resumo
    criarModalResumo({
      mesLabel,
      entradas,
      saidas,
      saldoAntes: fechamento.saldoAntes,
      saldoDepois: fechamento.saldoDepois
    });

    // Aviso: chamar atualização local se houver função global para isso
    if (typeof atualizarResumo === 'function') {
      try { atualizarResumo(); } catch (e) {}
    }
    if (typeof atualizarDashboard === 'function') {
      try { atualizarDashboard(); } catch (e) {}
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnFecharMes');
    if (btn) btn.addEventListener('click', () => {
      if (confirm('Deseja realmente fechar o mês atual? Isso arquivará os totais do mês e zerará as transações atuais.')) {
        fecharMesHandler();
      }
    });
  });

})();
