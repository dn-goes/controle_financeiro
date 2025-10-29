// Elementos
const formSaldoInicial = document.getElementById("formSaldoInicial");
const formTransacao = document.getElementById("formTransacao");
const saldoEl = document.getElementById("saldo");
const entradasEl = document.getElementById("entradas");
const saidasEl = document.getElementById("saidas");
const listaGastos = document.getElementById("listaGastos");

// Recupera dados do localStorage
let saldoInicial = parseFloat(localStorage.getItem("saldoInicial")) || 0;
let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

// Recupera resumo geral (usado pelo dividas.html)
let resumo = JSON.parse(localStorage.getItem("resumoFinanceiro")) || { saldo: saldoInicial, entradas: 0, saidas: 0 };

// 🔹 Atualiza o resumo geral
function atualizarResumo() {
  const entradas = transacoes
    .filter(t => t.tipo === "entrada")
    .reduce((acc, t) => acc + t.valor, 0);

  const saidas = transacoes
    .filter(t => t.tipo === "saida")
    .reduce((acc, t) => acc + t.valor, 0);

  const saldo = saldoInicial + entradas - saidas;

  saldoEl.textContent = `R$ ${saldo.toFixed(2)}`;
  entradasEl.textContent = `R$ ${entradas.toFixed(2)}`;
  saidasEl.textContent = `R$ ${saidas.toFixed(2)}`;

  // Atualiza objeto global do resumo
  resumo = { saldo, entradas, saidas };

  // Salva para o dividas.html ler
  localStorage.setItem("resumoFinanceiro", JSON.stringify(resumo));
  atualizarGrafico(entradas, saidas, saldo);
}

// 🔹 Renderiza gastos
function renderizarGastos() {
  listaGastos.innerHTML = "";
  const gastos = transacoes.filter(t => t.tipo === "saida");

  if (gastos.length === 0) {
    listaGastos.innerHTML = `<li>Nenhum gasto registrado 🧾</li>`;
    return;
  }

  gastos.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${t.descricao}</span><span class="valor">- R$ ${t.valor.toFixed(2)}</span>`;
    listaGastos.appendChild(li);
  });
}

// 🔹 Define saldo inicial
formSaldoInicial?.addEventListener("submit", (e) => {
  e.preventDefault();
  const novoSaldo = parseFloat(document.getElementById("saldoInicial").value);

  if (isNaN(novoSaldo)) {
    alert("Digite um valor válido!");
    return;
  }

  saldoInicial = novoSaldo;
  localStorage.setItem("saldoInicial", saldoInicial);
  document.getElementById("saldoInicial").value = "";
  atualizarResumo();
  alert("💰 Saldo inicial atualizado com sucesso!");
});

// 🔹 Adiciona nova transação
formTransacao?.addEventListener("submit", (e) => {
  e.preventDefault();

  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const tipo = document.getElementById("tipo").value;

  if (!descricao || isNaN(valor)) {
    alert("Preencha todos os campos corretamente!");
    return;
  }

  // Adiciona timestamp para permitir sumarização por mês
  transacoes.push({ descricao, valor, tipo, data: new Date().toISOString() });
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
  formTransacao.reset();
  atualizarResumo();
  renderizarGastos();
});

// 🔹 Gráfico de pizza
let grafico;
function atualizarGrafico(entradas, saidas, saldo) {
  const ctx = document.getElementById("graficoSaldo");
  if (!ctx) return;
  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Saldo Restante", "Entradas", "Gastos"],
      datasets: [{
        data: [saldo, entradas, saidas],
        backgroundColor: ["#00ff99", "#0099ff", "#ff6666"],
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "#fff" } }
      }
    }
  });
}

// 🔹 Sincronização com Dívidas
function sincronizarComDividas() {
  // Lê novamente o resumo do localStorage
  const resumoLocal = JSON.parse(localStorage.getItem("resumoFinanceiro"));
  if (resumoLocal && resumoLocal.saldo !== resumo.saldo) {
    resumo = resumoLocal;
    saldoInicial = resumoLocal.saldo; // ajusta saldo inicial se houver alteração
    atualizarResumo();
  }
}

// Atualiza tudo na inicialização
atualizarResumo();
renderizarGastos();

// 🔹 Verifica a cada 3 segundos se houve mudança de saldo no dividas.html
setInterval(sincronizarComDividas, 3000);
