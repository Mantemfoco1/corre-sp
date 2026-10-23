const state = {
  mode: "day",
  events: []
};

const $ = id => document.getElementById(id);

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

monthNames.forEach((month, index) => {
  $("month").add(
    new Option(month, String(index + 1).padStart(2, "0"))
  );
});

$("month").value = "11";

document.querySelectorAll(".mode").forEach(button => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;

    document.querySelectorAll(".mode").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    $("dayFields").classList.toggle(
      "hidden", state.mode !== "day"
    );

    $("rangeFields").classList.toggle(
      "hidden", state.mode !== "range"
    );

    $("monthFields").classList.toggle(
      "hidden", state.mode !== "month"
    );

    render();
  });
});

function dateRange() {
  if (state.mode === "day") {
    const day = $("day").value;
    return [day, day];
  }

  if (state.mode === "range") {
    return [$("start").value, $("end").value];
  }

  const year = $("year").value;
  const month = $("month").value;

  const lastDay = new Date(
    Number(year),
    Number(month),
    0
  ).getDate();

  return [
    `${year}-${month}-01`,
    `${year}-${month}-${lastDay}`
  ];
}

function formatPrice(price) {
  if (price === null || price === undefined) {
    return "A confirmar";
  }

  if (price === 0) {
    return "Grátis";
  }

  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function safe(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]
  );
}

function matchesDistance(event, selected) {
  if (!selected) return true;

  const distances = event.distancias || [];

  if (selected === "unknown") {
    return distances.length === 0;
  }

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

function render() {
  const [from, to] = dateRange();

  const maxPrice = $("price").value === ""
    ? null
    : Number($("price").value);

  const distance = $("distance").value;
  const query = $("searchText").value.trim().toLowerCase();

  let events = state.events.filter(event => {
    return event.data >= from &&
      event.data <= to &&
      matchesDistance(event, distance);
  });

  if (maxPrice !== null) {
    events = events.filter(event =>
      event.preco !== null &&
      event.preco !== undefined &&
      event.preco <= maxPrice
    );
  }

  if (query) {
    events = events.filter(event => {
      const searchable = [
        event.nome,
        event.local,
        event.endereco,
        event.organizador
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });
  }

  const sort = $("sort").value;

  events.sort((a, b) => {
    if (sort === "name") {
      return a.nome.localeCompare(b.nome);
    }

    if (sort === "price") {
      return (a.preco ?? Infinity) -
        (b.preco ?? Infinity);
    }

    return a.data.localeCompare(b.data);
  });

  $("count").textContent =
    `${events.length} evento${events.length === 1 ? "" : "s"}`;

  $("results").innerHTML = events.map(createCard).join("");

  $("empty").classList.toggle("hidden", events.length > 0);
}

function createCard(event) {
  const date = new Date(event.data + "T12:00:00");

  const distances = (event.distancias || []).length
    ? event.distancias.map(distance =>
        `<span class="pill">${distance} km</span>`
      ).join("")
    : '<span class="pill">Distância a confirmar</span>';

  const mapAddress = encodeURIComponent(
    event.endereco || event.local || "São Paulo SP"
  );

  return `
    <article class="race-card">
      <div class="race-top">
        <div>
          <h3>${safe(event.nome)}</h3>
          <div class="organizer">
            ${safe(event.organizador || "Organizador a confirmar")}
          </div>
        </div>

        <div class="race-date">
          <strong>${date.getDate()}</strong>
          ${date.toLocaleDateString("pt-BR", { month: "short" })}
        </div>
      </div>

      <div>
        <span class="status">CONFIRME OS DETALHES</span>
      </div>

      <div class="detail">
        <span class="ico">◷</span>
        <div>
          <strong>Largada:</strong>
          ${safe(event.horario || "A confirmar")}
        </div>
      </div>

      <div class="detail">
        <span class="ico">⌖</span>
        <div>
          <strong>Local:</strong> ${safe(event.local || "A confirmar")}
          <br>
          ${safe(event.endereco || "Endereço a confirmar")}
        </div>
      </div>

      <div class="detail">
        <span class="ico">R$</span>
        <div>
          <strong>Inscrição:</strong>
          ${formatPrice(event.preco)}
        </div>
      </div>

      <div class="detail">
        <span class="ico">◉</span>
        <div>
          <strong>Retirada do kit:</strong>
          ${safe(event.kit || "A confirmar no regulamento")}
        </div>
      </div>

      <div class="pills">${distances}</div>

      <p class="small-note">
        ${safe(event.status || "Confira os detalhes com o organizador.")}
      </p>

      <div class="card-links">
        <a href="${safe(event.oficial)}"
           target="_blank" rel="noopener">
          Organizador ↗
        </a>

        <a href="${safe(event.fonte)}"
           target="_blank" rel="noopener">
          Fonte ↗
        </a>

        <a href="https://www.google.com/maps/search/?api=1&query=${mapAddress}"
           target="_blank" rel="noopener">
          Ver mapa ↗
        </a>
      </div>
    </article>
  `;
}

[
  "day", "start", "end", "month", "year",
  "distance", "price", "searchText", "sort"
].forEach(id => {
  $(id).addEventListener("input", render);
});

$("weekBtn").addEventListener("click", () => {
  const chosenDate = $("start").value;

  if (!chosenDate) {
    alert("Escolha uma data inicial primeiro.");
    return;
  }

  const date = new Date(chosenDate + "T12:00:00");

  // Segunda-feira = início da semana.
  const weekday = (date.getDay() + 6) % 7;

  date.setDate(date.getDate() - weekday);
  $("start").value = date.toISOString().slice(0, 10);

  date.setDate(date.getDate() + 6);
  $("end").value = date.toISOString().slice(0, 10);

  render();
});

$("clearBtn").addEventListener("click", () => {
  $("distance").value = "";
  $("price").value = "";
  $("searchText").value = "";
  $("sort").value = "date";

  render();
});

fetch("./corridas.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("Não foi possível carregar corridas.json");
    }

    return response.json();
  })
  .then(data => {
    state.events = data;
    render();
  })
  .catch(error => {
    $("count").textContent = "Erro ao carregar a base";

    $("results").innerHTML = `
      <p class="empty">
        Não foi possível carregar corridas.json.
        Confira se o arquivo está na mesma pasta de index.html.
      </p>
    `;

    console.error(error);
  });
