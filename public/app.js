const game = document.getElementById("game");
const progressText = document.getElementById("progressText");
let busy = false;

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function setFeedback(message, kind = "") {
  const feedback = document.getElementById("feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = `feedback ${kind}`;
}

async function submitAnswer(answer) {
  if (busy) return;
  busy = true;
  const button = document.querySelector("[data-submit]");
  if (button) button.disabled = true;
  try {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const result = await response.json();
    if (!result.ok) {
      setFeedback(result.message || "Ce n'est pas la bonne réponse.", "bad");
      return;
    }
    setFeedback(result.message || "Dossier déverrouillé.", "good");
    await new Promise((resolve) => setTimeout(resolve, 450));
    await load();
  } catch {
    setFeedback("Impossible de contacter le serveur. Réessayez.", "bad");
  } finally {
    busy = false;
    if (button) button.disabled = false;
  }
}

function renderEvidence(stage) {
  return `<details class="evidence-drawer" open>
    <summary>CONSULTER LES PREUVES <span>(${stage.evidence.length})</span></summary>
    <ul class="evidence">${stage.evidence.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  </details>`;
}

function renderBase(stage, puzzle) {
  return `<div class="stage-heading"><div class="tag">${escapeHtml(stage.tag)} <span>• ÉPREUVE ${stage.id}/5</span></div><h2>${escapeHtml(stage.title)}</h2><p class="intro">${escapeHtml(stage.intro)}</p></div>${renderEvidence(stage)}<div class="puzzle-panel"><div class="puzzle-label">ATELIER DE DÉDUCTION</div><p class="question">${escapeHtml(stage.question)}</p>${puzzle}<p id="feedback" class="feedback" role="status" aria-live="polite"></p></div><details class="hints"><summary>OUVRIR LES INDICES</summary>${stage.hints.map((hint, index) => `<p><strong>Indice ${index + 1} :</strong> ${escapeHtml(hint)}</p>`).join("")}</details>`;
}

function renderOrderPuzzle() {
  const people = ["NORA", "ALINE", "BENOIT", "SAMIR"];
  return `<div class="order-puzzle"><p class="microcopy">Réorganisez les cartes. Les boutons restent disponibles sur mobile.</p><div class="order-list" id="orderList">${people.map((person, index) => `<div class="order-card" draggable="true" data-person="${person}"><span class="order-number">0${index + 1}</span><strong>${person}</strong><span class="order-controls"><button type="button" data-move="up" aria-label="Monter ${person}">↑</button><button type="button" data-move="down" aria-label="Descendre ${person}">↓</button></span></div>`).join("")}</div><button class="btn puzzle-action" data-order-submit type="button">VÉRIFIER L'ORDRE</button></div>`;
}

function renderGridPuzzle() {
  const letters = [
    "T",
    "",
    "A",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "P",
    "I",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "S",
  ];
  return `<div class="grid-puzzle"><p class="microcopy">Suivez le trajet indiqué dans la marge. Touchez les lettres dans l'ordre, ou utilisez la saisie de secours.</p><div class="letter-grid" id="letterGrid">${letters.map((letter, index) => `<button type="button" class="grid-cell ${letter ? "has-letter" : "empty"}" data-cell="${index}" ${letter ? "" : "disabled"}>${letter || "·"}</button>`).join("")}</div><div class="path-readout"><span>PARCOURS</span><strong id="pathReadout">_ _ _ _ _</strong></div><button class="btn puzzle-action" data-grid-reset type="button">RECOMMENCER</button><form id="gridAnswerForm" class="answer-row puzzle-fallback"><input id="gridAnswer" autocomplete="off" placeholder="Réponse de secours…" aria-label="Réponse du parcours" required><button class="btn" type="submit">VALIDER LE MOT</button></form></div>`;
}

function renderFilterPuzzle() {
  const numbers = [9, 12, 14, 16, 17, 18, 21, 24];
  return `<div class="filter-puzzle"><div class="number-tray" id="numberTray">${numbers.map((number) => `<span class="number-chip" data-number="${number}">${String(number).padStart(2, "0")}</span>`).join("")}</div><div class="filter-controls"><button type="button" class="filter-button" data-filter="odd">01 · IMPAIRS</button><button type="button" class="filter-button" data-filter="range">02 · ENTRE 10 ET 22</button><button type="button" class="filter-button" data-filter="sum">03 · SOMME ≠ 3</button></div><p class="filter-status" id="filterStatus">Filtre 1 disponible</p><button class="btn puzzle-action" data-filter-submit type="button" disabled>VALIDER LE NUMÉRO FINAL</button></div>`;
}

function renderLinesPuzzle() {
  const lines = [
    ["04/04", "Hier n'explique pas toujours aujourd'hui."],
    ["01/04", "Caché dans le silence, le dossier attend."],
    ["05/04", "Enfin, la vérité reste à découvrir."],
    ["03/04", "Chaque minute éloigne les curieux."],
    ["02/04", "Au milieu des ombres, personne ne regarde."],
  ];
  return `<div class="lines-puzzle"><p class="microcopy">Remettez les fragments dans l'ordre chronologique.</p><div class="line-list" id="lineList">${lines.map(([date, text]) => `<div class="line-card" draggable="true" data-date="${date}"><span class="line-date">${date}</span><span>${text}</span><span class="order-controls"><button type="button" data-move="up" aria-label="Monter la ligne">↑</button><button type="button" data-move="down" aria-label="Descendre la ligne">↓</button></span></div>`).join("")}</div><button class="btn puzzle-action" data-lines-submit type="button">LIRE LA NOTE</button></div>`;
}

function renderFinalPuzzle() {
  return `<div class="final-puzzle"><div class="fragment-chain"><span>NORA</span><i>+</i><span>CACHE</span><i>+</i><span>17</span><i>+</i><span>SOUS-LE-TAPIS</span><i>+</i><b>CODE</b></div><p class="microcopy">Assemblez les quatre fragments, puis ajoutez le code remis par l'organisateur.</p><form id="answerForm" class="answer-row"><input id="answer" autocomplete="off" placeholder="Phrase finale…" aria-label="Phrase finale" required><button class="btn" data-submit type="submit">DÉPOSER LA RÉPONSE</button></form></div>`;
}

function renderPuzzle(stage) {
  if (stage.id === 1) return renderOrderPuzzle();
  if (stage.id === 2) return renderGridPuzzle();
  if (stage.id === 3) return renderFilterPuzzle();
  if (stage.id === 4) return renderLinesPuzzle();
  return renderFinalPuzzle();
}

function getCards(container) {
  return [...container.children];
}

function swapCard(card, direction) {
  const sibling =
    direction === "up" ? card.previousElementSibling : card.nextElementSibling;
  if (!sibling) return;
  if (direction === "up") card.parentElement.insertBefore(card, sibling);
  else card.parentElement.insertBefore(sibling, card);
  getCards(card.parentElement).forEach((item, index) => {
    const number = item.querySelector(".order-number");
    if (number) number.textContent = `0${index + 1}`;
  });
}

function enableSorting(container) {
  let dragged;
  container.addEventListener("dragstart", (event) => {
    dragged = event.target.closest("[draggable]");
    if (dragged) dragged.classList.add("dragging");
  });
  container.addEventListener("dragend", () => {
    if (dragged) dragged.classList.remove("dragging");
    dragged = null;
  });
  container.addEventListener("dragover", (event) => {
    event.preventDefault();
    const target = event.target.closest("[draggable]");
    if (!dragged || !target || target === dragged) return;
    const box = target.getBoundingClientRect();
    container.insertBefore(
      dragged,
      event.clientY > box.top + box.height / 2 ? target.nextSibling : target,
    );
  });
}

function bindPuzzle(stage) {
  if (stage.id === 1) {
    const list = document.getElementById("orderList");
    list.addEventListener("click", (event) => {
      const move = event.target.closest("[data-move]");
      if (move) swapCard(move.closest("[data-person]"), move.dataset.move);
    });
    enableSorting(list);
    document
      .querySelector("[data-order-submit]")
      .addEventListener("click", () => {
        const order = getCards(list).map((card) => card.dataset.person);
        if (order.join("-") !== "BENOIT-SAMIR-NORA-ALINE") {
          setFeedback(
            "La chaîne ne respecte pas encore toutes les contraintes.",
            "bad",
          );
          return;
        }
        submitAnswer("NORA");
      });
  }
  if (stage.id === 2) {
    const expected = [0, 2, 12, 13, 23];
    let path = [];
    const readout = document.getElementById("pathReadout");
    document.getElementById("letterGrid").addEventListener("click", (event) => {
      const cell = event.target.closest("[data-cell]");
      if (!cell) return;
      const index = Number(cell.dataset.cell);
      if (index !== expected[path.length]) {
        path = [];
        document
          .querySelectorAll(".grid-cell.selected")
          .forEach((item) => item.classList.remove("selected"));
        readout.textContent = "_ _ _ _ _";
        setFeedback(
          "Le trajet est interrompu. Reprenez depuis la première lettre.",
          "bad",
        );
        return;
      }
      path.push(index);
      cell.classList.add("selected");
      readout.textContent = path
        .map(
          (item) => document.querySelector(`[data-cell="${item}"]`).textContent,
        )
        .join(" ");
      if (path.length === expected.length) submitAnswer("TAPIS");
    });
    document
      .querySelector("[data-grid-reset]")
      .addEventListener("click", () => {
        path = [];
        document
          .querySelectorAll(".grid-cell.selected")
          .forEach((item) => item.classList.remove("selected"));
        readout.textContent = "_ _ _ _ _";
        setFeedback("");
      });
    document
      .getElementById("gridAnswerForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        submitAnswer(document.getElementById("gridAnswer").value);
      });
  }
  if (stage.id === 3) {
    const allNumbers = [9, 12, 14, 16, 17, 18, 21, 24];
    const filters = {
      odd: (number) => number % 2 === 1,
      range: (number) => number > 10 && number < 22,
      sum: (number) =>
        String(number)
          .split("")
          .reduce((total, digit) => total + Number(digit), 0) !== 3,
    };
    let values = allNumbers;
    let step = 0;
    document.querySelectorAll("[data-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        const expected = ["odd", "range", "sum"][step];
        if (button.dataset.filter !== expected) {
          setFeedback("Suivez les filtres dans l'ordre indiqué.", "bad");
          return;
        }
        values = values.filter(filters[expected]);
        step += 1;
        document
          .querySelectorAll(".number-chip")
          .forEach((chip) =>
            chip.classList.toggle(
              "removed",
              !values.includes(Number(chip.dataset.number)),
            ),
          );
        button.classList.add("completed");
        const next = document.querySelectorAll("[data-filter]")[step];
        document.getElementById("filterStatus").textContent = next
          ? `Filtre ${step + 1} disponible`
          : `Il reste : ${values.join(", ")}`;
        if (step === 3)
          document.querySelector("[data-filter-submit]").disabled = false;
      }),
    );
    document
      .querySelector("[data-filter-submit]")
      .addEventListener("click", () => submitAnswer(String(values[0])));
  }
  if (stage.id === 4) {
    const list = document.getElementById("lineList");
    list.addEventListener("click", (event) => {
      const move = event.target.closest("[data-move]");
      if (move) swapCard(move.closest("[data-date]"), move.dataset.move);
    });
    enableSorting(list);
    document
      .querySelector("[data-lines-submit]")
      .addEventListener("click", () => {
        const order = getCards(list).map((card) => card.dataset.date);
        if (order.join(",") !== "01/04,02/04,03/04,04/04,05/04") {
          setFeedback("La chronologie n'est pas encore correcte.", "bad");
          return;
        }
        submitAnswer("CACHE");
      });
  }
  const form = document.getElementById("answerForm");
  if (form)
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAnswer(document.getElementById("answer").value);
    });
}

async function load() {
  const response = await fetch("/api/state", { cache: "no-store" });
  const state = await response.json();
  progressText.textContent = `DOSSIER ${String(Math.min(state.solved.length + 1, 5)).padStart(2, "0")} / 05`;
  if (state.complete) {
    game.innerHTML = `<div class="complete"><span class="stamp">ENQUÊTE RÉSOLUE</span><h2>Le message est reconstitué.</h2><p>Les quatre fragments sont à leur place. Le dossier 017 peut enfin être remis à l'organisateur.</p><div class="complete-mark">017</div></div>`;
    return;
  }
  const stage = state.stage;
  game.innerHTML = renderBase(stage, renderPuzzle(stage));
  bindPuzzle(stage);
}

load().catch(() => {
  game.innerHTML =
    '<p class="load-error">Le dossier n\'a pas pu être chargé. Vérifiez que le serveur est démarré.</p>';
});
