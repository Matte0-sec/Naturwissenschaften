(() => {
  const topicForm = document.querySelector("#schoolTopicForm");
  const topicInput = document.querySelector("#schoolTopicInput");
  const topicResults = document.querySelector("#schoolTopicResults");
  const subjects = {
    physics: { name: "Physik", open: () => window.openPhysicsPlatform(), cards: "#experimentCards", id: "id", search: "#experimentSearch", all: "#categoryFilters [data-category='Alle']" },
    chemistry: { name: "Chemie", open: () => window.openChemistryPlatform(), cards: "#chemistryCards", id: "chemId", search: "#chemistrySearch", all: "#chemistryFilters [data-chem-filter='Alle']" },
    biology: { name: "Biologie", open: () => window.openBiologyPlatform(), cards: "#biologyCards", id: "bioId", search: "#biologySearch", all: "#biologyFilters [data-bio-filter='Alle']" },
  };
  const keywords = {
    accelerator: "atom teilchen kernphysik",
    electricity: "strom stromkreis spannung widerstand ohm elektronik",
    circuitBuilder: "strom stromkreis schaltung lampe batterie",
    magnetism: "magnet magnetfeld strom elektromagnetismus",
    gravity: "schwerkraft gravitation planet sonne weltraum",
    rocket: "kraft bewegung schwerkraft rakete",
    drag: "fallen luft fall geschwindigkeit kraft",
    waves: "wellen schwingung frequenz interferenz",
    heat: "warme temperatur thermodynamik energie",
    collision: "stoss impuls kraft bewegung",
    pendulum: "schwingung pendel chaos bewegung",
    blackhole: "schwerkraft gravitation weltraum astronomie",
    optics: "licht optik spiegel linse brechung",
    projectile: "wurf bewegung fall schwerkraft",
    titration: "saure laugen base basen ph neutralisation",
    acidMaterials: "saure metalle reaktion wasserstoff",
    kinetics: "chemische reaktion katalysator geschwindigkeit",
    equilibrium: "chemische reaktion gleichgewicht",
    electrolysis: "elektrizitat strom redox elektrochemie",
    gases: "gas druck volumen temperatur",
    calorimetry: "warme energie temperatur reaktion",
    solubility: "salz losen losung wasser",
    redox: "strom batterie elektrochemie oxidation reduktion",
    molecules: "molekule atom bindung chemische bindungen",
    radioactivity: "atom kernphysik radioaktivitat halbwertszeit strahlung",
    photosynthesis: "fotosynthese pflanze pflanzen licht chlorophyll zucker",
    enzymes: "enzym eiweiss proteine stoffwechsel",
    osmosis: "osmose zelle membran wasser",
    radiation: "strahlung radioaktivitat zelle dna",
    viruses: "virus viren infektion immunsystem",
    muscle: "muskel korper training sport",
    respiration: "zellatmung atmung zelle energie stoffwechsel",
    population: "okosystem population wachstum umwelt",
  };
  const ignoredWords = new Set(["und", "oder", "das", "die", "der", "dem", "den", "des", "ein", "eine", "einer", "einem", "eines", "mein", "meine", "meinem", "thema", "schule", "unterricht", "uber", "von", "fur", "mit", "auf", "im", "in", "bei", "zum", "zur", "ist", "sind", "wird", "werden", "wie", "was"]);

  function normalize(text) {
    return text.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u").replace(/₂/g, "2");
  }

  function findExperiments(query) {
    const words = normalize(query).match(/[\p{L}\p{N}]+/gu) || [];
    const terms = words
      .filter((word) => !ignoredWords.has(word) && (word.length >= 3 || word === "ph"))
      .map((word) => word.length >= 6 ? word.replace(/(en|e|n|s)$/, "") : word);
    if (!terms.length) return [];
    return Object.entries(subjects).flatMap(([subject, info]) =>
      window.labExperimentCatalog[subject].map((experiment) => {
        const title = normalize(experiment.title);
        const details = normalize([experiment.category, experiment.description, experiment.challenge, ...experiment.controls].join(" "));
        const tags = normalize(keywords[experiment.id] || "");
        const score = terms.reduce((sum, term) => sum + (title.includes(term) ? 5 : 0) + (details.includes(term) ? 2 : 0) + (tags.includes(term) ? 3 : 0), 0);
        return { ...experiment, subject, subjectName: info.name, score };
      })
    ).filter((experiment) => experiment.score > 0).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de"));
  }

  function openExperiment(experiment) {
    const subject = subjects[experiment.subject];
    subject.open();
    const search = document.querySelector(subject.search);
    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector(subject.all).click();
    const card = [...document.querySelector(subject.cards).querySelectorAll(".experiment-card")].find((item) => item.dataset[subject.id] === experiment.id);
    if (!card) {
      document.querySelector("#homeScreen").hidden = false;
      document.querySelector(`#${experiment.subject}Platform`).hidden = true;
      topicResults.textContent = "Das Experiment konnte nicht geöffnet werden. Bitte versuche es erneut.";
      return;
    }
    card.click();
    card.focus();
  }

  topicForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = topicInput.value.trim();
    topicResults.replaceChildren();
    if (!query) {
      topicResults.textContent = "Bitte gib ein Thema ein.";
      return;
    }
    const matches = findExperiments(query);
    const summary = document.createElement("p");
    summary.textContent = matches.length
      ? `${matches.length} passende ${matches.length === 1 ? "Vorschlag" : "Vorschläge"} gefunden.`
      : "Keine passenden Experimente gefunden. Probiere einen anderen Begriff, zum Beispiel „Strom“ oder „Zelle“. Es werden nur vorhandene Experimente durchsucht.";
    topicResults.append(summary);
    if (!matches.length) return;
    const list = document.createElement("div");
    list.className = "school-topic-list";
    matches.forEach((experiment) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "school-topic-result";
      const subject = document.createElement("span");
      subject.textContent = experiment.subjectName;
      const title = document.createElement("b");
      title.textContent = experiment.title;
      const description = document.createElement("small");
      description.textContent = experiment.description;
      button.append(subject, title, description);
      button.addEventListener("click", () => openExperiment(experiment));
      list.append(button);
    });
    topicResults.append(list);
  });

  const workbookKey = "scienceLabWorkbook";
  const workbookDialog = document.querySelector("#workbookDialog");
  const workbookPages = document.querySelector("#workbookPages");
  const workbookTitle = document.querySelector("#workbookPageTitle");
  const workbookNotes = document.querySelector("#workbookPageNotes");
  const workbookStatus = document.querySelector("#workbookStatus");
  const workbookNewPage = document.querySelector("#workbookNewPage");
  let pages = [{ title: "", notes: "" }];
  let activePage = 0;
  let workbookAvailable = true;

  try {
    const saved = localStorage.getItem(workbookKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || !parsed.length || !parsed.every((page) => page && typeof page.title === "string" && typeof page.notes === "string")) {
        throw new Error("Ungültiges Arbeitsheft");
      }
      pages = parsed;
    }
  } catch (error) {
    workbookAvailable = false;
    workbookStatus.textContent = "Das Arbeitsheft konnte nicht geladen werden. Die gespeicherten Daten wurden nicht überschrieben.";
    console.error("Arbeitsheft konnte nicht geladen werden:", error);
    workbookTitle.disabled = true;
    workbookNotes.disabled = true;
    workbookNewPage.disabled = true;
  }

  function saveWorkbook() {
    try {
      localStorage.setItem(workbookKey, JSON.stringify(pages));
      workbookStatus.textContent = "Im Browser gespeichert.";
      return true;
    } catch (error) {
      workbookStatus.textContent = "Speichern fehlgeschlagen. Deine Änderungen sind nur bis zum Schließen dieser Seite verfügbar.";
      console.error("Arbeitsheft konnte nicht gespeichert werden:", error);
      return false;
    }
  }

  function renderWorkbookPages() {
    workbookPages.replaceChildren();
    pages.forEach((page, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "workbook-page";
      button.classList.toggle("active", index === activePage);
      if (index === activePage) button.setAttribute("aria-current", "page");
      button.textContent = `${index + 1}. ${page.title.trim() || "Ohne Titel"}`;
      button.addEventListener("click", () => {
        activePage = index;
        renderWorkbook();
      });
      workbookPages.append(button);
    });
  }

  function renderWorkbook() {
    workbookTitle.value = pages[activePage].title;
    workbookNotes.value = pages[activePage].notes;
    renderWorkbookPages();
  }

  function updateWorkbook() {
    pages[activePage].title = workbookTitle.value;
    pages[activePage].notes = workbookNotes.value;
    saveWorkbook();
    renderWorkbookPages();
  }

  workbookTitle.addEventListener("input", updateWorkbook);
  workbookNotes.addEventListener("input", updateWorkbook);
  workbookNewPage.addEventListener("click", () => {
    pages.push({ title: "", notes: "" });
    activePage = pages.length - 1;
    saveWorkbook();
    renderWorkbook();
    workbookTitle.focus();
  });
  document.querySelector("#workbookOpen").addEventListener("click", () => {
    workbookDialog.hidden = false;
    renderWorkbook();
    if (workbookAvailable) workbookTitle.focus();
    else document.querySelector("#workbookClose").focus();
  });
  function closeWorkbook() {
    workbookDialog.hidden = true;
    document.querySelector("#workbookOpen").focus();
  }
  document.querySelector("#workbookClose").addEventListener("click", closeWorkbook);
  workbookDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWorkbook();
  });
})();
