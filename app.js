
const form = document.getElementById("searchForm");
const dataInput = document.getElementById("data");
const distanceInput = document.getElementById("distance");
const priceInput = document.getElementById("price");
const resultsList = document.getElementById("resultsList");
const count = document.getElementById("count");
const empty = document.getElementById("empty");
const initial = document.getElementById("initial");

let corridas = [];

async function carregarCorridas() {
  count.textContent = "Carregando corridas...";

  try {
    const resposta = await fetch("./corridas.json?t=" + Date.now());

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar corridas.json");
    }

    corridas = await resposta.json();

    if (!Array.isArray(corridas)) {
      throw new Error("O arquivo JSON precisa conter uma lista.");
    }

    count.textContent = `${corridas.length} corridas cadastradas`;
  } catch (erro) {
    count.textContent = "Erro ao carregar";
    resultsList.innerHTML =
      '<p class="empty">Erro ao carregar corridas. Verifique o arquivo corridas.json.</p>';
    console.error(erro);
  }
}

function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caractere]);
}

function mostrarCorridas(lista) {
  resultsList.innerHTML = "";

  initial.classList.add("hidden");
  empty.classList.add("hidden");

  if (lista.length === 0) {
    empty.classList.remove("hidden");
    count.textContent = "Nenhuma corrida encontrada";
    return;
  }

  count.textContent = `${lista.length} corrida(s) encontrada(s)`;

  lista.forEach(corrida => {
    const distancias = Array.isArray(corrida.distancias)
      && corrida.distancias.length
      ? corrida.distancias.join(", ") + " km"
      : "Não informado";

    const preco = corrida.preco != null
      ? `R$ ${Number(corrida.preco).toFixed(2).replace(".", ",")}`
      : "Não informado";

    const data = corrida.data
      ? corrida.data.split("-").reverse().join("/")
      : "Não informado";

    const links = [corrida.oficial, corrida.fonte]
      .filter((url, i, listaUrls) =>
        url && listaUrls.indexOf(url) === i
      )
      .map(url =>
        `<a href="${escapar(url)}" target="_blank" rel="noopener">Ver fonte</a>`
      ).join(" · ");

    const card = document.createElement("article");
    card.className = "race-card";

    card.innerHTML = `
      <h3>${escapar(corrida.nome || "Corrida")}</h3>
      <p><strong>Data:</strong> ${escapar(data)}</p>
      <p><strong>Distância:</strong> ${escapar(distancias)}</p>
      <p><strong>Preço:</strong> ${escapar(preco)}</p>
      <p><strong>Horário:</strong> ${escapar(corrida.horario || "Não informado")}</p>
      <p><strong>Largada:</strong> ${escapar(corrida.endereco || "Não informado")}</p>
      <p><strong>Retirada do kit:</strong> ${escapar(corrida.kit || "Não informado")}</p>
      <p>${links || "Fonte não informada"}</p>
    `;

    resultsList.appendChild(card);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const dataSelecionada = dataInput.value;
  const distanciaSelecionada = distanceInput.value;
  const precoMaximo = priceInput.value.trim() === ""
    ? null
    : Number(priceInput.value);

  const filtradas = corridas.filter(corrida => {
    if (dataSelecionada && corrida.data !== dataSelecionada) {
      return false;
    }

    if (distanciaSelecionada) {
      const distancias = (corrida.distancias || []).map(Number);

      if (!distancias.includes(Number(distanciaSelecionada))) {
        return false;
      }
    }

    if (precoMaximo !== null &&
        corrida.preco != null &&
        Number(corrida.preco) > precoMaximo) {
      return false;
    }

    return true;
  });

  mostrarCorridas(filtradas);
});

carregarCorridas().then(() => {
  if (corridas.length > 0) {
    count.textContent = `${corridas.length} corridas cadastradas`;
  }
});
