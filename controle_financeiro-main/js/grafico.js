// Variáveis globais para armazenar as instâncias dos gráficos (para poder destruí-las depois)
let monthlyBarChart = null;
let categoryDoughnutChart = null;

// --- FUNÇÃO PRINCIPAL DE CARREGAMENTO ---

// 'DOMContentLoaded' espera o HTML ser carregado antes de rodar o JS
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Gera dados de exemplo se o localStorage estiver vazio
  verificarEMockarDados();

  // 2. Carrega o relatório com o período padrão (6 meses)
  carregarRelatorio(6);

  // 3. Adiciona 'click' aos botões de filtro
  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      // Remove a classe 'active' de todos os botões
      document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
      // Adiciona 'active' apenas ao botão clicado
      button.classList.add("active");
      
      // Pega o número de meses do atributo 'data-meses' do botão
      const meses = parseInt(button.dataset.meses);
      
      // Recarrega todos os dados da página com o novo período
      carregarRelatorio(meses);
    });
  });
});

/**
 * Função central que busca dados e atualiza todos os elementos da página.
 * É chamada no carregamento e toda vez que um filtro de período é clicado.
 * * @param {number} numMeses - O número de meses para analisar (ex: 3, 6, 12).
 */
function carregarRelatorio(numMeses) {
  // Busca todos os dados necessários do armazenamento local do navegador
  const transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
  const dividas = JSON.parse(localStorage.getItem("dividas")) || [];
  const dividasPagas = JSON.parse(localStorage.getItem("dividasPagas")) || [];

  // --- Verificação de Estado Vazio ---
  // Se não houver NENHUMA transação, mostra a mensagem de erro e para
  if (transacoes.length === 0) {
    mostrarEstadoVazio(true);
    // Mesmo sem transações, atualizamos os cards de dívida (eles podem existir)
    atualizarResumoDividas(dividas, dividasPagas);
    return; // Para a execução da função aqui
  }
  
  // Se houver dados, garante que os gráficos estão visíveis
  mostrarEstadoVazio(false);

  // --- Processamento de Dados ---
  // Processa os dados brutos para o formato que os gráficos precisam
  const dadosPeriodo = processarDadosMensais(transacoes, numMeses);
  const dadosCategorias = processarCategorias(transacoes, numMeses);
  
  // --- Renderização ---
  // Atualiza os elementos visuais na tela
  renderizarGraficoBarras(dadosPeriodo.labels, dadosPeriodo.entradas, dadosPeriodo.saidas);
  renderizarGraficoCategorias(dadosCategorias.labels, dadosCategorias.data);
  atualizarMetricas(dadosPeriodo);
  atualizarResumoDividas(dividas, dividasPagas);
}

/**
 * Controla a exibição da mensagem de "Estado Vazio"
 * * @param {boolean} isVazio - True se não houver dados.
 */
function mostrarEstadoVazio(isVazio) {
  const emptyEl = document.getElementById('emptyState');
  const gridEl = document.getElementById('reportGrid');
  
  if (isVazio) {
    emptyEl.style.display = 'block'; // Mostra mensagem "Nenhum dado"
    gridEl.style.display = 'none';  // Esconde o grid dos gráficos
  } else {
    emptyEl.style.display = 'none';  // Esconde a mensagem
    gridEl.style.display = 'grid'; // Mostra o grid (no CSS é 'grid', não 'block')
  }
}


// --- FUNÇÕES DE PROCESSAMENTO DE DADOS ---

/**
 * Processa o array de transações para o gráfico de barras mensal.
 * * @param {Array} transacoes - Array de todas as transações.
 * @param {number} numMeses - Quantidade de meses para trás.
 * @returns {Object} - Objeto com labels (meses), entradas (valores) e saídas (valores).
 */
function processarDadosMensais(transacoes, numMeses) {
  const labels = []; // Ex: ["Jan", "Fev", "Mar"]
  const entradas = new Array(numMeses).fill(0); // Ex: [3500, 3600, 3450]
  const saidas = new Array(numMeses).fill(0);   // Ex: [2000, 2100, 1950]
  
  const hoje = new Date();
  // Clona a data para não modificar 'hoje'
  let dataFiltro = new Date(hoje.getFullYear(), hoje.getMonth() - numMeses + 1, 1);

  // Formatador para abreviar o nome do mês (ex: "jan", "fev")
  const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

  // 1. Cria os labels dos meses (ex: 6M = "mai", "jun", "jul", "ago", "set", "out")
  for (let i = 0; i < numMeses; i++) {
    labels.push(monthFormatter.format(dataFiltro).replace('.', ''));
    dataFiltro.setMonth(dataFiltro.getMonth() + 1); // Avança 1 mês
  }
  
  // Data de corte (início do período de análise)
  const dataInicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - numMeses + 1, 1);

  // 2. Itera sobre TODAS as transações
  for (const transacao of transacoes) {
    const dataTransacao = new Date(transacao.data);

    // Filtra apenas transações que estão dentro do período selecionado
    if (dataTransacao >= dataInicioPeriodo) {
      // Descobre a qual mês (índice do array) essa transação pertence
      const diffMeses = (dataTransacao.getFullYear() - dataInicioPeriodo.getFullYear()) * 12 + (dataTransacao.getMonth() - dataInicioPeriodo.getMonth());
      
      if (diffMeses >= 0 && diffMeses < numMeses) {
        if (transacao.tipo === 'entrada') {
          entradas[diffMeses] += transacao.valor;
        } else if (transacao.tipo === 'saida') {
          saidas[diffMeses] += transacao.valor;
        }
      }
    }
  }
  return { labels, entradas, saidas };
}

/**
 * Processa as categorias de SAÍDA do período.
 * * @param {Array} transacoes - Array de todas as transações.
 * @param {number} numMeses - Quantidade de meses para trás.
 * @returns {Object} - Objeto com labels (categorias) e data (valores).
 */
function processarCategorias(transacoes, numMeses) {
  const categorias = {}; // Objeto para agrupar (ex: { Moradia: 1200, Lazer: 300 })
  
  const hoje = new Date();
  const dataInicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - numMeses + 1, 1);

  for (const transacao of transacoes) {
    const dataTransacao = new Date(transacao.data);

    // Filtra apenas saídas (despesas) dentro do período
    if (transacao.tipo === 'saida' && dataTransacao >= dataInicioPeriodo) {
      const cat = transacao.categoria || 'Outros'; // Garante uma categoria padrão
      if (!categorias[cat]) {
        categorias[cat] = 0; // Inicializa a categoria se for a 1ª vez
      }
      categorias[cat] += transacao.valor; // Soma o valor
    }
  }
  
  // Transforma o objeto em arrays que o Chart.js entende
  const labels = Object.keys(categorias); // Ex: ["Moradia", "Lazer"]
  const data = Object.values(categorias); // Ex: [1200, 300]
  
  return { labels, data };
}


// --- FUNÇÕES DE RENDERIZAÇÃO (GRÁFICOS) ---

/**
 * Cria ou atualiza o gráfico de barras.
 */
function renderizarGraficoBarras(labels, entradasData, saidasData) {
  const ctx = document.getElementById('monthlyBarChart').getContext('2d');
  
  // Destrói o gráfico anterior, se ele existir (evita sobreposição)
  if (monthlyBarChart) {
    monthlyBarChart.destroy();
  }
  
  // Cria o novo gráfico
  monthlyBarChart = new Chart(ctx, {
    type: 'bar', // Tipo barra
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Entradas',
          data: entradasData,
          backgroundColor: 'var(--primary-green)', // Cor das variáveis CSS
          borderRadius: 4,
        },
        {
          label: 'Saídas',
          data: saidasData,
          backgroundColor: 'var(--primary-red)', // Cor das variáveis CSS
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Permite que o gráfico preencha o contêiner
      scales: {
        y: { 
          beginAtZero: true, 
          ticks: { color: 'var(--text-secondary)' } // Cor dos números do eixo Y
        },
        x: { 
          ticks: { color: 'var(--text-secondary)' } // Cor dos meses do eixo X
        }
      },
      plugins: {
        legend: { 
          labels: { color: 'var(--text-primary)', font: { size: 14 } } // Cor da legenda
        }
      }
    }
  });
}

/**
 * Cria ou atualiza o gráfico de rosca (categorias).
 */
function renderizarGraficoCategorias(labels, data) {
  const ctx = document.getElementById('categoryDoughnutChart').getContext('2d');
  
  // Destrói o gráfico anterior
  if (categoryDoughnutChart) {
    categoryDoughnutChart.destroy();
  }
  
  // Caso especial: Não há nenhuma saída no período
  if (data.length === 0) {
    data = [1]; // Dado fantasma
    labels = ["Nenhuma saída no período"];
    const backgroundColors = ['#4a506e']; // Cor cinza/azulada
    
    // Cria um gráfico "vazio"
    categoryDoughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: backgroundColors, borderColor: 'var(--card-bg)', borderWidth: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: 'var(--text-primary)', font: { size: 14 } } }
        }
      }
    });
    return; // Para a execução
  }

  // Se houver dados, usa as cores normais
  const backgroundColors = ['#1e88e5', '#e53935', '#f57c00', '#43a047', '#ffb300', '#6d4c41'];
  
  categoryDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: 'var(--card-bg)', // Borda da cor do fundo do card
        borderWidth: 4,
        hoverOffset: 10 // Efeito ao passar o mouse
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom', // Legenda embaixo
          labels: { color: 'var(--text-primary)', font: { size: 14 } }
        }
      }
    }
  });
}

// --- FUNÇÕES DE ATUALIZAÇÃO (MÉTRICAS) ---

// Helper: Formata um número para BRL (R$ 1.234,56)
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Atualiza os cards de "Métricas Chave"
 */
function atualizarMetricas(dadosPeriodo) {
  const totalEntradas = dadosPeriodo.entradas.reduce((a, b) => a + b, 0); // Soma todas entradas
  const totalSaidas = dadosPeriodo.saidas.reduce((a, b) => a + b, 0);   // Soma todas saídas
  const numMeses = dadosPeriodo.labels.length;
  
  const mediaEntradas = numMeses > 0 ? totalEntradas / numMeses : 0;
  const mediaSaidas = numMeses > 0 ? totalSaidas / numMeses : 0;
  const balancoTotal = totalEntradas - totalSaidas;
  
  // Calcula a % de meses em que a entrada foi maior que a saída
  let mesesPositivos = 0;
  for(let i=0; i < numMeses; i++) {
    if (dadosPeriodo.entradas[i] > dadosPeriodo.saidas[i]) {
      mesesPositivos++;
    }
  }
  const percPositivo = numMeses > 0 ? (mesesPositivos / numMeses) * 100 : 0;

  // Atualiza o HTML
  document.getElementById('metricaReceitaMedia').textContent = formatCurrency(mediaEntradas);
  document.getElementById('metricaDespesaMedia').textContent = formatCurrency(mediaSaidas);
  
  const balancoEl = document.getElementById('metricaBalancoTotal');
  balancoEl.textContent = formatCurrency(balancoTotal);
  // Adiciona classe 'positivo' ou 'negativo' para o CSS colorir
  balancoEl.className = balancoTotal >= 0 ? 'positivo' : 'negativo';
  
  document.getElementById('metricaMesesPositivo').textContent = `${percPositivo.toFixed(0)}%`;
}

/**
 * Atualiza o card "Resumo de Dívidas"
 */
function atualizarResumoDividas(dividas, dividasPagas) {
  // .reduce() soma todos os valores do array
  const totalAtivas = dividas.reduce((acc, div) => acc + (div.valor || 0), 0);
  const totalPagas = dividasPagas.reduce((acc, div) => acc + (div.valor || 0), 0);

  document.getElementById('dividaTotalAtiva').textContent = formatCurrency(totalAtivas);
  document.getElementById('dividaTotalPaga').textContent = formatCurrency(totalPagas);
  document.getElementById('dividaContagemAtiva').textContent = dividas.length;
  document.getElementById('dividaContagemPaga').textContent = dividasPagas.length;
}

// --- FUNÇÃO DE MOCK DE DADOS (PARA TESTE) ---

/**
 * Cria dados fictícios no localStorage APENAS SE não houverem dados.
 * Isso faz a página funcionar e exibir gráficos na primeira visita.
 */
function verificarEMockarDados() {
  // Só cria dados MOCK se a chave 'transacoes' NÃO existir
  if (!localStorage.getItem('transacoes')) {
    console.warn("Nenhuma transação encontrada. Criando dados MOCK (fictícios)...");
    
    const transacoesMock = [];
    const categoriasMock = ['Moradia', 'Transporte', 'Alimentação', 'Lazer', 'Saúde'];
    const hoje = new Date();
    let idCounter = 1;

    // Cria 1 ano (12 meses) de dados fictícios
    for (let mes = 12; mes >= 0; mes--) { 
      // 1 Salário por mês
      transacoesMock.push({
        id: idCounter++,
        data: new Date(hoje.getFullYear(), hoje.getMonth() - mes, 1).toISOString(),
        tipo: 'entrada',
        valor: 3500 + Math.random() * 500, // Salário entre 3500-4000
        categoria: 'Salário',
        descricao: 'Salário Mensal'
      });
      
      // 10-15 transações de saída por mês
      for (let i = 0; i < 12; i++) {
        const dia = Math.floor(Math.random() * 28) + 1; // Dia aleatório
        const categoria = categoriasMock[Math.floor(Math.random() * categoriasMock.length)];
        transacoesMock.push({
          id: idCounter++,
          data: new Date(hoje.getFullYear(), hoje.getMonth() - mes, dia).toISOString(),
          tipo: 'saida',
          valor: Math.random() * 150 + 20, // Gasto entre 20-170
          categoria: categoria,
          descricao: `Compra em ${categoria}`
        });
      }
    }
    // Salva os dados fictícios no localStorage
    localStorage.setItem('transacoes', JSON.stringify(transacoesMock));
  }

  // Cria dívidas fictícias (se não existirem)
  if (!localStorage.getItem('dividas')) {
    const dividasMock = [
      { id: 1, nome: 'Cartão Nubank', valor: 850.70, vencimento: '2025-11-20' },
      { id: 2, nome: 'Financiamento Apto', valor: 1200.00, vencimento: '2025-11-10' }
    ];
    localStorage.setItem('dividas', JSON.stringify(dividasMock));

    // Também cria um resumo financeiro mock para a index.html
    const resumoMock = { saldo: 500, entradas: 3500, saidas: 3000 };
    localStorage.setItem('resumoFinanceiro', JSON.stringify(resumoMock));
  }

  // Cria dívidas pagas fictícias (se não existirem)
  if (!localStorage.getItem('dividasPagas')) {
    const dividasPagasMock = [
      { id: 3, nome: 'Cartão Inter', valor: 430.20, vencimento: '2025-10-20' }
    ];
    localStorage.setItem('dividasPagas', JSON.stringify(dividasPagasMock));
  }
}