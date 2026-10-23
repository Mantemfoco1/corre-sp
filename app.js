
const $ = id => document.getElementById(id);

let events = [];

function formatPrice(price) {
  if (price === null || price === undefined) {
    return "A confirmar";
  }

  if (price === 0) return "Grátis";

  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function matchesDistance(event, selected) {
  if (!selected) return true;

  const distances = event.distancias || [];
  const target = Number(selected);

  return distances.some(distance => {
    if (target === 21) {
      return distance >= 20 && distance < 22;
    }

    if (target === 42) {
      return distance >= 40;
    }

    return distance === target;
  });
}

function searchRaces() {
  const date = $("date").value;
  const distance = $("distance").value;

  const priceInput = $("price").value;
  const maxPrice = priceInput === ""
    ? null
    : Number(priceInput);

  if (!date) {
    $("date").focus();
    return;
  }

  let filtered = events.filter(race => {
    if (race.data !== date) return false;

    if (!matchesDistance(race, distance)) {
      return false;
    }

    if (maxPrice !== null) {
      if (race.preco === null ||
          race.preco === undefined) {
        return false;
      }

      if (race.preco > maxPrice) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );

  $("count").textContent =
    `${filtered.length} corrida(s) encontrada(s)`;

  $("initial").classList.add("hidden");

  $("empty").classList.toggle(
    "hidden",
    filtered.length > 0
  );

  $("resultsList").innerHTML = filtered.map(race => {
    const date = new Date(race.data + "T12:00:00")
      .toLocaleDateString("pt-BR");

    const distances = (race.distancias || []).length
      ? race.distancias.map(km => `${km} km`).join(", ")
      : "A confirmar";

    const mapQuery = encodeURIComponent(
      race.endereco || race.local || "São Paulo, SP"
    );

    return `
      <article class="race-card">
        <div class="card-head">
          <h3>${safe(race.nome)}</h3>
          <span class="date-tag">${date}</span>
        </div>

        <div class="race-info">
          <div>
            <strong>Distâncias:</strong>
            ${safe(distances)}
          </div>

          <div>
            <strong>Inscrição:</strong>
            ${formatPrice(race.preco)}
          </div>

          <div>
            <strong>Largada:</strong>
            ${safe(race.horario || "A confirmar")}
          </div>

          <div>
            <strong>Endereço:</strong>
            ${safe(race.endereco || "A confirmar")}
          </div>

          <div>
            <strong>Retirada do kit:</strong>
            ${safe(race.kit || "A confirmar")}
          </div>

          <div>
            ${safe(race.status || "Confirme os dados com o organizador.")}
          </div>
        </div>

        <div class="card-links">
          <a href="${safe(race.oficial)}"
             target="_blank" rel="noopener">
            Organizador ↗
          </a>
          &nbsp;·&nbsp;
          <a href="${safe(race.fonte)}"
             target="_blank" rel="noopener">
            Fonte ↗
          </a>
          &nbsp;·&nbsp;
          <a href="https://www.google.com/maps/search/?api=1&query=${mapQuery}"
             target="_blank" rel="noopener">
            Mapa ↗
          </a>
        </div>
      </article>
    `;
  }).join("");
}

$("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  searchRaces();
});

fetch("./corridas.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("Erro ao carregar corridas.json");
    }

    return response.json();
  })
  .then(data => {
    events = data;
    $("count").textContent =
      "Selecione os filtros e pesquise";
  })
  .catch(error => {
    $("count").textContent = "Erro ao carregar corridas";

    $("initial").textContent =
      "Não foi possível carregar corridas.json. Verifique se ele está na raiz do repositório.";

    console.error(error);
  });
