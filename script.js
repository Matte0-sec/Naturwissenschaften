const controls = {
  heat: document.querySelector("#heat"),
  acid: document.querySelector("#acid"),
  base: document.querySelector("#base"),
};

const output = {
  heatValue: document.querySelector("#heatValue"),
  acidValue: document.querySelector("#acidValue"),
  baseValue: document.querySelector("#baseValue"),
  temperature: document.querySelector("#temperature"),
  tempMeter: document.querySelector("#tempMeter"),
  ph: document.querySelector("#ph"),
  phMarker: document.querySelector("#phMarker"),
  phLabel: document.querySelector("#phLabel"),
  energy: document.querySelector("#energy"),
  energyMeter: document.querySelector("#energyMeter"),
  rate: document.querySelector("#rate"),
  reactionText: document.querySelector("#reactionText"),
  liquid: document.querySelector("#liquid"),
  phase: document.querySelector("#phase"),
  observation: document.querySelector("#observation"),
};

let running = false;
let elapsed = 0;
let timerId;
let mode = "physics";

function schoolTopic(text) {
  if (/Säure|Metalle|Lauge|pH/i.test(text)) return "Du siehst, wie eine Flüssigkeit Dinge verändern kann.";
  if (/Pflanz|Licht|Glucose|Sauerstoff/i.test(text)) return "Du siehst, was eine Pflanze mit Licht machen kann.";
  if (/Zell|Enzym|DNA|Körper|Population/i.test(text)) return "Du siehst, wie kleine Teile von Lebewesen zusammenarbeiten.";
  if (/Wärme|Temperatur/i.test(text)) return "Du siehst, wie Wärme von einem Ort zum anderen wandert.";
  if (/Strom|Batterie|Spule/i.test(text)) return "Du siehst, wie Strom Dinge bewegen oder verändern kann.";
  if (/Schwerkraft|Planet|Rakete|Bahn/i.test(text)) return "Du siehst, wie Dinge sich durch Schwerkraft bewegen.";
  if (/Welle|Lichtstrahl|Linse|Spiegel/i.test(text)) return "Du siehst, wie sich Wellen oder Licht bewegen.";
  return "Du siehst, wie eine Änderung eine andere Sache beeinflusst.";
}

function schoolExplanation(text) {
  return `${schoolTopic(text)} Stell an einem Regler und schau auf das Bild und die Zahlen.`;
}

function schoolDetail(text) {
  return `${schoolTopic(text)} So probierst du es aus: Ändere nur einen Regler. Warte kurz und vergleiche dann Bild und Zahlen mit vorher.`;
}

const levelQuestions = {
  accelerator: ["Stell die Spannung höher. Wird der Kreis des Teilchens größer oder kleiner?", "Vergleiche Spannung und Magnetfeld. Welche Einstellung verändert die Kreisbahn stärker?", "Plane Messreihen für Spannung und Magnetfeld. Prüfe, ob Energie und Bahnradius so zusammenhängen, wie du vermutest."],
  electricity: ["Stell den Widerstand kleiner. Was passiert mit dem Strom?", "Vergleiche zwei Widerstände bei gleicher Spannung. Wie ändern sich Strom und Leistung?", "Plane einen Test zum Ohmschen Gesetz. Welche Größe hältst du gleich und welche Fehler kann ein Kurzschluss verursachen?"],
  circuitBuilder: ["Setze Batterie, Schalter, Widerstand und Lampe ein. Wann leuchtet die Lampe?", "Baue den Kreis vollständig und vergleiche zwei Widerstände. Wie verändert sich die Helligkeit?", "Plane Messungen zu Spannung, Widerstand und Stromstärke. Begründe anhand des Ohmschen Gesetzes, warum der Aufbau nur geschlossen Strom führt."],
  magnetism: ["Dreh den Strom hoch. Bewegt sich das Eisenstück stärker?", "Vergleiche Strom und Windungszahl. Welche Einstellung verstärkt das Magnetfeld mehr?", "Entwirf eine Messreihe für die Feldstärke. Begründe, welche Größen du konstant hältst."],
  gravity: ["Ändere die Startgeschwindigkeit. Fällt das Objekt herunter oder fliegt es herum?", "Vergleiche Masse und Startgeschwindigkeit. Welche Größe entscheidet stärker über die Bahn?", "Bestimme einen Bereich stabiler Bahnen und bewerte die Grenzen des vereinfachten Modells."],
  rocket: ["Dreh den Schub hoch. Hebt die Rakete ab?", "Vergleiche mehr Schub mit weniger Startmasse. Welche Änderung verbessert den Start stärker?", "Plane einen fairen Startvergleich und bewerte den Einfluss von Treibstoffmasse und Luftwiderstand."],
  drag: ["Ändere die Form. Fällt der Körper schneller oder langsamer?", "Vergleiche Fläche und Form. Welche Einstellung verändert die Endgeschwindigkeit stärker?", "Teste die quadratische Abhängigkeit vom Tempo und diskutiere, wann das Modell ungenau wird."],
  waves: ["Ändere die Wellenhöhe. Wo werden die Wellen besonders hoch?", "Vergleiche Frequenz und Wellenhöhe. Wie ändern sich die Streifen im Wasser?", "Plane eine Messung der Stellen mit Verstärkung und prüfe den Einfluss der Phasenlage."],
  heat: ["Mach einen Körper wärmer. Was passiert mit der Temperatur des anderen?", "Vergleiche Temperaturunterschied und Wärmeleitung. Was macht den Austausch schneller?", "Bestimme die zeitliche Temperaturänderung und bewerte, welche Wärmeverluste das Modell weglässt."],
  collision: ["Ändere die Geschwindigkeit einer Kugel. Wie rollen die Kugeln danach?", "Vergleiche Massen und Stoßfaktor. Welche Einstellung verändert die Bewegung nach dem Stoß stärker?", "Prüfe Impuls und Bewegungsenergie vor und nach dem Stoß für mehrere Stoßfaktoren."],
  pendulum: ["Ändere den Startwinkel ein wenig. Bewegen sich die Pendel gleich?", "Vergleiche zwei nahe Startwinkel. Nach welcher Zeit sehen die Bewegungen deutlich anders aus?", "Untersuche die Empfindlichkeit gegenüber dem Startwinkel und erkläre, warum eine Langzeitvorhersage schwierig ist."],
  blackhole: ["Mach das schwarze Loch schwerer. Wie ändert sich die Bahn?", "Vergleiche Masse und Startgeschwindigkeit. Welche Änderung krümmt die Bahn stärker?", "Bestimme Flucht- und Einfangbereiche und diskutiere, welche Effekte das Newton-Modell nicht zeigt."],
  optics: ["Mach die Brennweite kleiner. Wo treffen sich die Lichtstrahlen?", "Vergleiche Brennweite und Laserwinkel. Welche Einstellung verschiebt den Treffpunkt stärker?", "Prüfe die Abbildungsbedingungen mit mehreren Strahlen und bewerte die Grenzen des Linsenmodells."],
  projectile: ["Ändere den Winkel. Fliegt der Ball weiter oder kürzer?", "Vergleiche Winkel und Starttempo. Welche Einstellung verändert die Reichweite stärker?", "Bestimme den Winkel mit der größten Reichweite für mehrere Geschwindigkeiten und bewerte die Annahme ohne Luftwiderstand."],
  titration: ["Gib mehr Lauge dazu. Welche Farbe bekommt die Flüssigkeit?", "Vergleiche Säuremenge und Konzentration. Wie verschiebt sich der Punkt, an dem die Flüssigkeit neutral ist?", "Bestimme den Äquivalenzpunkt für mehrere Konzentrationen und bewerte die Annahme einer starken Säure und Lauge."],
  acidMaterials: ["Wähle ein anderes Material. Bei welchem siehst du die meisten Blasen?", "Vergleiche Material und Säurestärke. Welche Änderung macht die Reaktion schneller?", "Plane Vergleichsversuche mit gleicher Masse und Temperatur. Leite aus Gasmenge und Restmasse eine Reaktionsreihe ab."],
  kinetics: ["Mach es wärmer. Läuft die Reaktion schneller oder langsamer?", "Vergleiche Temperatur und Konzentration. Welche Einstellung erhöht die Reaktionsgeschwindigkeit stärker?", "Bestimme eine Geschwindigkeitsregel aus mehreren Messreihen und bewerte die Annahmen der Stoßtheorie."],
  equilibrium: ["Gib mehr Startstoff dazu. Entsteht mehr Produkt?", "Vergleiche Temperatur und Stoffmenge. Wie verschiebt sich das Gleichgewicht?", "Bestimme die Gleichgewichtslage für mehrere Temperaturen und diskutiere die Modellannahmen."],
  electrolysis: ["Mach den Strom größer. Entsteht mehr Metall?", "Vergleiche Stromstärke und Zeit. Welche Einstellung erhöht die Metallmenge stärker?", "Prüfe mit Messreihen das Verhältnis von Ladung und abgeschiedener Stoffmenge."],
  gases: ["Mach das Gefäß kleiner. Steigt oder sinkt der Druck?", "Vergleiche Temperatur und Volumen. Welche Einstellung verändert den Druck stärker?", "Teste die Gasgleichung mit mehreren Wertepaaren und bewerte, wann ein echtes Gas abweicht."],
  calorimetry: ["Nimm mehr Reaktionsstoff. Wird das Wasser wärmer oder kälter?", "Vergleiche Stoffmenge und Wassermasse. Welche Einstellung verändert die Temperatur stärker?", "Bestimme die Reaktionswärme aus Temperaturmessungen und diskutiere Wärmeverluste."],
  solubility: ["Mach das Wasser wärmer. Löst sich mehr Salz?", "Vergleiche Temperatur und Wassermenge. Welche Einstellung verändert die gelöste Salzmenge stärker?", "Erstelle eine Löslichkeitskurve und bewerte, warum der Wert bei echten Lösungen abweichen kann."],
  redox: ["Ändere eine Seite der Batterie. Wird die Spannung größer oder kleiner?", "Vergleiche Anode und Kathode. Welche Kombination liefert die größte Spannung?", "Untersuche den Einfluss der Ionenkonzentration auf die Spannung und bewerte die Modellgrenzen."],
  molecules: ["Füge ein freies Elektronenpaar hinzu. Ändert sich der Winkel?", "Vergleiche Bindungspaare und freie Paare. Welche verändern den Winkel stärker?", "Leite aus mehreren Modellen eine Regel für Bindungswinkel ab und prüfe ihre Grenzen."],
  radioactivity: ["Warte länger. Wie viele Punkte bleiben übrig?", "Vergleiche Halbwertszeit und Beobachtungszeit. Welche Einstellung verändert die Restmenge stärker?", "Prüfe die exponentielle Abnahme mit mehreren Halbwertszeiten und bewerte zufällige Abweichungen."],
  photosynthesis: ["Mach das Licht heller. Entsteht mehr Sauerstoff?", "Vergleiche Licht und Kohlendioxid. Welche Einstellung erhöht die Sauerstoffmenge stärker?", "Bestimme den begrenzenden Faktor bei verschiedenen Bedingungen und bewerte das vereinfachte Pflanzenmodell."],
  enzymes: ["Ändere die Temperatur. Wann arbeitet das Enzym am besten?", "Vergleiche Temperatur und pH-Wert. Welche Änderung senkt die Aktivität stärker?", "Bestimme den optimalen Bereich und erkläre mit einem Modell, warum die Aktivität außerhalb davon sinkt."],
  osmosis: ["Mach die Flüssigkeit außen stärker. Wird die Zelle größer oder kleiner?", "Vergleiche Innen- und Außenmenge gelöster Stoffe. Was verändert das Zellvolumen stärker?", "Bestimme den Bereich ohne Volumenänderung und bewerte die Annahme einer idealen Zellmembran."],
  radiation: ["Mach die Schutzschicht dicker. Bleiben mehr Zellen gesund?", "Vergleiche Abstand und Schutzschicht. Welche Einstellung schützt die Zellen stärker?", "Bestimme Dosiswerte für gleiches Zellüberleben und bewerte die Grenzen des virtuellen Gewebemodells."],
  viruses: ["Wähle ein Organ und ein Virus. Was verändert sich am Organ?", "Vergleiche zwei Virusarten im gleichen Organ. Welche schädigt mehr Zellen?", "Untersuche Organ- und Virusrisiken mit gleichen Bedingungen und bewerte die Grenzen des vereinfachten Modells."],
  respiration: ["Gib mehr Sauerstoff dazu. Entsteht mehr Energie?", "Vergleiche Sauerstoff und Glucose. Welche Einstellung erhöht die Energieausbeute stärker?", "Bestimme den begrenzenden Stoff bei mehreren Bedingungen und bewerte die Modellannahmen."],
  population: ["Gib mehr Platz und Nahrung. Wachsen mehr Lebewesen?", "Vergleiche Startzahl und Umweltgrenze. Welche Einstellung verändert die spätere Anzahl stärker?", "Bestimme Wachstumskurven für mehrere Umweltgrenzen und bewerte die Annahme einer konstanten Umwelt."],
};

function levelQuestion(level, fallback, id) {
  const variants = levelQuestions[id];
  if (!variants) return fallback;
  return variants[level];
}

const learningProfiles = {
  school: {
    name: "Schule",
    explanation: schoolExplanation,
    question: (text, id) => levelQuestion(0, "Arbeitsauftrag: Stell einen Regler höher oder niedriger. Was verändert sich im Bild?", id),
  },
  basic: {
    name: "Grundlagen",
    explanation: (text) => text,
    question: (text) => text,
  },
  advanced: {
    name: "Fortgeschritten",
    explanation: (text) => text,
    question: (text, id) => levelQuestion(1, "Vergleiche zwei verschiedene Einstellungen. Welche verändert das Ergebnis stärker? Begründe deine Antwort mit den Messwerten.", id),
  },
  expert: {
    name: "Expert:in",
    explanation: (text) => `Expertenmodus: ${text} Bewerte zusätzlich Modellannahmen, Skalierung und mögliche systematische Abweichungen der Simulation.`,
    question: (text, id) => levelQuestion(2, "Plane einen fairen Vergleichsversuch: Welche Größe veränderst du, welche misst du und welche Einstellungen hältst du gleich? Bewerte anschließend die Grenzen des Modells.", id),
  },
};

let learningProfile = "school";
window.labTeaching = {
  explanation(text) { return learningProfiles[learningProfile].explanation(text); },
  question(text, id) { return learningProfiles[learningProfile].question(text, id); },
  level() { return learningProfiles[learningProfile].name; },
  renderExplanation(targetId, text) {
    const target = document.querySelector(targetId);
    if (!target) return;
    target.textContent = learningProfiles[learningProfile].explanation(text);
    const box = target.closest(".explanation-box");
    const heading = box.querySelector("h3");
    let button = heading.querySelector(".school-info-button");
    let detail = box.querySelector(".school-info-detail");
    if (!button) {
      button = document.createElement("button");
      button.className = "school-info-button";
      button.type = "button";
      button.textContent = "ⓘ";
      button.setAttribute("aria-label", "Einfache Erklärung mit Beispiel anzeigen");
      heading.append(button);
      detail = document.createElement("p");
      detail.className = "school-info-detail";
      detail.hidden = true;
      box.append(detail);
      button.addEventListener("click", () => { detail.hidden = !detail.hidden; });
    }
    const isSchool = learningProfile === "school";
    button.hidden = !isSchool;
    detail.hidden = true;
    if (isSchool) detail.textContent = `Mehr dazu: ${schoolDetail(text)}`;
  },
};

function getValues() {
  const heat = mode === "physics" ? Number(controls.heat.value) : 0;
  const acid = mode === "chemistry" ? Number(controls.acid.value) : 0;
  const base = mode === "chemistry" ? Number(controls.base.value) : 0;
  const ph = Math.max(0, Math.min(14, 7 - acid * 0.31 + base * 0.31));
  const temperature = 22 + (heat * 0.75 * (1 - Math.exp(-elapsed / 13)));
  const energy = Math.max(0, (temperature - 22) * 1.34);
  const balance = Math.max(0, 1 - Math.abs(acid - base) / 20);
  const rate = mode === "physics" ? Math.min(100, energy * 1.1) : Math.min(100, (acid + base) * 3 + balance * 30);
  return { heat, acid, base, ph, temperature, energy, rate };
}

function liquidColor(ph) {
  if (ph < 4) return "#e76f51";
  if (ph < 6.5) return "#f4be46";
  if (ph < 8.5) return "#75c6b5";
  return "#5372af";
}

function update() {
  const values = getValues();
  output.heatValue.textContent = `${values.heat} %`;
  output.acidValue.textContent = `${values.acid} ml`;
  output.baseValue.textContent = `${values.base} ml`;
  output.temperature.innerHTML = `${values.temperature.toFixed(1)} <small>°C</small>`;
  output.tempMeter.style.width = `${Math.min(100, (values.temperature - 22) / 0.75)}%`;
  output.ph.textContent = values.ph.toFixed(1);
  output.phMarker.style.left = `${(values.ph / 14) * 100}%`;
  output.phLabel.textContent = values.ph < 6.5 ? "sauer" : values.ph > 7.5 ? "basisch" : "neutral";
  output.energy.innerHTML = `${values.energy.toFixed(1)} <small>kJ</small>`;
  output.energyMeter.style.width = `${Math.min(100, values.energy / 1.01)}%`;
  output.rate.textContent = `${values.rate.toFixed(1)} %`;
  output.liquid.style.background = liquidColor(values.ph);

  if (!running) {
    output.rate.textContent = "0.0 %";
    return;
  }
  const isPhysics = mode === "physics";
  output.phase.textContent = isPhysics ? (values.rate > 65 ? "Starke Bewegung" : "Erwärmung") : (values.rate > 65 ? "Reaktion läuft" : "Mischung entsteht");
  output.reactionText.textContent = isPhysics ? "Teilchen bewegen sich schneller" : "Säure und Lauge reagieren";
  output.observation.textContent = isPhysics
    ? `Bei ${values.temperature.toFixed(1)} °C besitzen die Teilchen ${values.energy.toFixed(1)} kJ Energie.`
    : `Die Lösung ist ${output.phLabel.textContent} (pH ${values.ph.toFixed(1)}). Die Stoffe reagieren miteinander.`;
}

function startExperiment() {
  if (running) return;
  running = true;
  document.body.classList.add("running");
  document.querySelector("#startButton").textContent = "Versuch läuft";
  timerId = window.setInterval(() => {
    elapsed += 0.5;
    update();
  }, 500);
  update();
}

function resetExperiment() {
  window.clearInterval(timerId);
  running = false;
  elapsed = 0;
  controls.heat.value = 55;
  controls.acid.value = 0;
  controls.base.value = 0;
  document.body.classList.remove("running");
  document.querySelector("#startButton").textContent = "Experiment starten";
  output.phase.textContent = "Bereit";
  output.reactionText.textContent = "Noch keine Aktivität";
  output.observation.textContent = "Stelle die Bedingungen ein und starte den Versuch.";
  update();
}

function selectMode(selectedMode) {
  if (selectedMode === "physics") {
    window.openPhysicsPlatform();
    return;
  }
  if (selectedMode === "chemistry") {
    window.openChemistryPlatform();
    return;
  }
  if (selectedMode === "biology") {
    window.openBiologyPlatform();
    return;
  }
  resetExperiment();
  mode = selectedMode;
  document.body.dataset.mode = mode;
  document.querySelector("#homeScreen").hidden = true;
  document.querySelector("#labScreen").hidden = false;
  const isPhysics = mode === "physics";
  document.querySelectorAll(".physics-only").forEach((element) => { element.hidden = !isPhysics; });
  document.querySelectorAll(".chemistry-only").forEach((element) => { element.hidden = isPhysics; });
  document.querySelector("#experimentNumber").textContent = isPhysics ? "Physik Experiment 01" : "Chemie Experiment 01";
  document.querySelector("#labTitle").innerHTML = isPhysics ? "Energie <span>&</span> Bewegung" : "Säure <span>&</span> Lauge";
  document.querySelector("#modeNote").textContent = isPhysics
    ? "Erhitze die Probe und beobachte, wie Temperatur und Teilchenenergie zusammenhängen."
    : "Mische Säure und Lauge und beobachte den pH-Wert sowie die Reaktionsaktivität.";
  document.querySelector("#resultLabel").textContent = isPhysics ? "Bewegungsenergie" : "Reaktionsrate";
  update();
}

Object.values(controls).forEach((control) => control.addEventListener("input", update));
document.querySelector("#startButton").addEventListener("click", startExperiment);
document.querySelector("#resetButton").addEventListener("click", resetExperiment);
document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.mode)));
document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => {
  learningProfile = button.dataset.profile;
  document.querySelectorAll("[data-profile]").forEach((item) => item.classList.toggle("active", item === button));
}));
document.querySelector("#homeButton").addEventListener("click", () => {
  resetExperiment();
  document.querySelector("#labScreen").hidden = true;
  document.querySelector("#homeScreen").hidden = false;
});

for (let index = 0; index < 16; index += 1) {
  const bubble = document.createElement("i");
  bubble.style.left = `${8 + (index * 23) % 78}%`;
  bubble.style.animationDelay = `${(index % 6) * 0.23}s`;
  bubble.style.animationDuration = `${1 + (index % 4) * 0.22}s`;
  document.querySelector("#bubbles").append(bubble);
}

update();