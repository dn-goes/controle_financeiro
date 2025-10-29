const formDivida = document.getElementById("formDivida");
const listaDividas = document.getElementById("listaDividas");
let dividas = JSON.parse(localStorage.getItem("dividas")) || [];

function renderDividas() {
  listaDividas.innerHTML = "";
  dividas.forEach((d, i) => {
    const li = document.createElement("li");
    li.textContent = `${d.credor} - R$ ${d.valor.toFixed(2)}`;
    const btn = document.createElement("button");
    btn.textContent = "🗑️";
    btn.onclick = () => {
      dividas.splice(i, 1);
      localStorage.setItem("dividas", JSON.stringify(dividas));
      renderDividas();
    };
    li.appendChild(btn);
    listaDividas.appendChild(li);
  });
}

formDivida.addEventListener("submit", e => {
  e.preventDefault();
  const credor = document.getElementById("credor").value;
  const valor = parseFloat(document.getElementById("valorDivida").value);
  if (!credor || isNaN(valor)) return alert("Preencha corretamente!");
  dividas.push({ credor, valor });
  localStorage.setItem("dividas", JSON.stringify(dividas));
  renderDividas();
  formDivida.reset();
});

renderDividas();
