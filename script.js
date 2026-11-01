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

const learningProfileKey = "scienceLabLearningProfile";
const savedLearningProfile = localStorage.getItem(learningProfileKey);
let learningProfile = Object.prototype.hasOwnProperty.call(learningProfiles, savedLearningProfile) ? savedLearningProfile : "school";
document.querySelectorAll("[data-profile]").forEach((button) => {
  button.classList.toggle("active", button.dataset.profile === learningProfile);
});
window.labTeaching = {
  explanation(text) { return learningProfiles[learningProfile].explanation(text); },
  question(text, id) { return learningProfiles[learningProfile].question(text, id); },
  level() { return learningProfiles[learningProfile].name; },
  profile() { return learningProfile; },
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

const quizDialog = document.querySelector("#quizDialog");
const quizSubject = document.querySelector("#quizSubject");
const quizTitle = document.querySelector("#quizTitle");
const quizIntro = document.querySelector("#quizIntro");
const quizExperimentList = document.querySelector("#quizExperimentList");
const quizQuestions = document.querySelector("#quizQuestions");
const quizStart = document.querySelector("#quizStart");
const quizCheck = document.querySelector("#quizCheck");
const quizResult = document.querySelector("#quizResult");
const achievementDialog = document.querySelector("#achievementDialog");
const achievementSummary = document.querySelector("#achievementSummary");
const achievementBadges = document.querySelector("#achievementBadges");
let quizExperiments = [];
let dailyQuizQuestionsForRun = null;
const achievementKey = "scienceLabQuizProgress";
const emptyQuizProgress = () => ({ points: 0, solved: 0, lastLevel: "Noch kein Quiz", badges: [] });
let quizProgress = JSON.parse(localStorage.getItem(achievementKey) || JSON.stringify(emptyQuizProgress()));
const dailyQuizKey = "scienceLabDailyQuiz";
const dailyQuizButton = document.querySelector("#dailyQuizButton");

const dailyQuestionBank = {
  school: [
    { prompt: "Ein warmer Körper steht neben einem kalten. In welche Richtung fließt Wärme zuerst?", answer: "Vom warmen zum kalten Körper.", wrong: ["Vom kalten zum warmen Körper.", "Beide Körper geben keine Wärme ab.", "Wärme fließt nur, wenn beide gleich warm sind."] },
    { prompt: "Was passiert mit dem Strom, wenn bei gleicher Spannung der Widerstand kleiner wird?", answer: "Der Strom wird größer.", wrong: ["Der Strom wird kleiner.", "Der Strom bleibt immer gleich.", "Der Strom hört ganz auf zu fließen."] },
    { prompt: "Welchen pH-Wert hat eine neutrale Lösung ungefähr?", answer: "pH 7", wrong: ["pH 2", "pH 5", "pH 12"] },
    { prompt: "Was braucht eine Pflanze für die Photosynthese?", answer: "Licht und Kohlenstoffdioxid.", wrong: ["Nur Sauerstoff.", "Nur Zucker und Dunkelheit.", "Salz und keinen Wasserbedarf."] },
    { prompt: "Wohin bewegt sich Wasser bei der Osmose bevorzugt?", answer: "Zur Seite mit mehr gelösten Teilchen.", wrong: ["Immer aus der Zelle heraus.", "Immer zur Seite mit weniger gelösten Teilchen.", "Es bewegt sich nur, wenn die Membran fehlt."] },
    { prompt: "Was kann mit einem Enzym bei zu hoher Temperatur passieren?", answer: "Seine Form verändert sich und es arbeitet schlechter.", wrong: ["Es wird zu einem neuen Substrat.", "Es wird bei jeder Temperatur immer schneller.", "Es verwandelt sich vollständig in Wasser."] },
    { prompt: "Was geschieht mit dem Gasdruck, wenn ein Gas bei gleicher Temperatur weniger Platz hat?", answer: "Der Druck steigt.", wrong: ["Der Druck sinkt immer auf null.", "Der Druck bleibt unabhängig vom Volumen gleich.", "Das Gas wird automatisch flüssig."] },
    { prompt: "Was bedeutet eine Halbwertszeit bei radioaktiven Teilchen?", answer: "Nach dieser Zeit ist ungefähr die Hälfte der ursprünglichen Teilchen übrig.", wrong: ["Alle Teilchen sind zerfallen.", "Die Anzahl hat sich verdoppelt.", "Jedes Teilchen wird genau halb so groß."] },
    { prompt: "Wann kann Strom durch einen einfachen Stromkreis fließen?", answer: "Wenn der Stromkreis geschlossen ist.", wrong: ["Wenn der Schalter geöffnet ist.", "Nur wenn die Lampe entfernt wurde.", "Nur bei unterbrochenen Kabeln."] },
    { prompt: "Was passiert mit einer sauren Lösung, wenn man vorsichtig Lauge zugibt?", answer: "Der pH-Wert bewegt sich in Richtung neutral.", wrong: ["Der pH-Wert sinkt immer weiter.", "Die Lösung wird automatisch zu reinem Wasser.", "Der pH-Wert bleibt grundsätzlich unverändert."] },
    { prompt: "Was passiert mit einem fallengelassenen Gegenstand nahe der Erdoberfläche?", answer: "Die Schwerkraft beschleunigt ihn nach unten.", wrong: ["Die Schwerkraft zieht ihn nach oben.", "Er bleibt ohne weitere Kräfte immer an derselben Stelle.", "Seine Masse verschwindet während des Falls."] },
    { prompt: "Welche Aussage über eine Nahrungskette ist richtig?", answer: "Energie wird von einem Lebewesen zum nächsten weitergegeben.", wrong: ["Alle Lebewesen erhalten Energie nur direkt aus dem Boden.", "Energie entsteht erst am Ende der Nahrungskette.", "Pflanzen können keine Energie speichern."] },
    { prompt: "Was zeigt ein Thermometer beim Erwärmen eines Stoffes normalerweise an?", answer: "Eine höhere Temperatur.", wrong: ["Eine niedrigere Masse.", "Einen kleineren pH-Wert.", "Eine geringere Stoffmenge."] },
    { prompt: "Was kann passieren, wenn man mehr Salz in Wasser gibt, als sich lösen kann?", answer: "Ein Teil des Salzes bleibt ungelöst zurück.", wrong: ["Das Wasser wird zu einem Gas.", "Das Salz verschwindet unabhängig von der Wassermenge immer vollständig.", "Die Lösung wird automatisch sauer."] },
    { prompt: "Was brauchen die meisten Tiere als unmittelbare Energiequelle für ihre Bewegung?", answer: "Energie aus der Nahrung.", wrong: ["Nur Sonnenlicht direkt auf den Muskeln.", "Ausschließlich Mineralstoffe.", "Keinen Sauerstoff oder Nährstoffe."] },
  ],
  basic: [
    { prompt: "Eine Batterie liefert 12 V. Der Widerstand wird von 6 Ω auf 3 Ω halbiert. Was passiert mit der Stromstärke?", answer: "Sie verdoppelt sich von 2 A auf 4 A.", wrong: ["Sie halbiert sich von 2 A auf 1 A.", "Sie bleibt bei 2 A.", "Sie steigt auf 18 A."] },
    { prompt: "Dieselbe Wärmemenge erwärmt entweder 100 g oder 50 g Wasser. Welche Probe wird stärker erwärmt?", answer: "Die 50-g-Probe, ungefähr doppelt so stark.", wrong: ["Die 100-g-Probe, ungefähr doppelt so stark.", "Beide gleich stark, unabhängig von der Masse.", "Keine, denn Wasser kann keine Wärme aufnehmen."] },
    { prompt: "Die Sauerstoffproduktion steigt erst mit mehr Licht, erreicht dann aber ein Plateau. Was ist eine passende Erklärung?", answer: "Ein anderer Faktor wie CO₂ oder Temperatur begrenzt nun die Photosynthese.", wrong: ["Licht wird ab diesem Punkt zu Kohlenstoffdioxid.", "Die Pflanze hat aufgehört, Wasser zu benötigen.", "Mehr Licht senkt immer sofort die Temperatur."] },
    { prompt: "Warum kann ein Enzym bei stark verändertem pH-Wert weniger Substrat umsetzen?", answer: "Die Ladungen und die Form des aktiven Zentrums können sich verändern.", wrong: ["Der pH-Wert entfernt alle Substrate aus der Lösung.", "Enzyme reagieren ausschließlich mit Sauerstoff.", "Der pH-Wert verändert nur die Farbe, nie die Funktion."] },
    { prompt: "Zu einer reversiblen Reaktion wird mehr Ausgangsstoff gegeben. Welche Verschiebung ist typischerweise zu erwarten?", answer: "Das Gleichgewicht verschiebt sich in Richtung der Produkte.", wrong: ["Es gibt danach grundsätzlich keine Rückreaktion mehr.", "Das Gleichgewicht verschiebt sich immer zu den Ausgangsstoffen.", "Die Stoffmenge aller Produkte muss sofort null werden."] },
    { prompt: "Die absolute Temperatur eines idealen Gases steigt von 300 K auf 600 K. Wie verändert sich die mittlere Bewegungsenergie der Teilchen?", answer: "Sie verdoppelt sich.", wrong: ["Sie halbiert sich.", "Sie bleibt unverändert.", "Sie vervierfacht sich."] },
    { prompt: "Zwei Widerstände von 4 Ω und 6 Ω sind in Reihe geschaltet. Wie groß ist der Gesamtwiderstand?", answer: "10 Ω", wrong: ["2,4 Ω", "6 Ω", "24 Ω"] },
    { prompt: "Eine radioaktive Probe durchläuft drei Halbwertszeiten. Welcher Anteil der Anfangsmenge bleibt ungefähr?", answer: "12,5 %", wrong: ["25 %", "37,5 %", "75 %"] },
    { prompt: "Eine Zelle kommt in eine stärker konzentrierte Außenlösung. Was ist aufgrund der Osmose zu erwarten?", answer: "Wasser verlässt die Zelle und ihr Volumen kann abnehmen.", wrong: ["Wasser strömt ausschließlich in die Zelle.", "Gelöste Teilchen passieren immer frei die Membran.", "Die Konzentrationsunterschiede werden sofort größer."] },
    { prompt: "Ein Strom von 2 A fließt 5 Sekunden lang. Welche Ladungsmenge fließt durch den Leiter?", answer: "10 C", wrong: ["2,5 C", "7 C", "25 C"] },
    { prompt: "Eine saure Lösung wird mit Wasser verdünnt. Was geschieht typischerweise mit ihrem pH-Wert?", answer: "Er nähert sich 7 an.", wrong: ["Er entfernt sich immer weiter von 7.", "Er wird unabhängig von der Säure sofort genau 7.", "Er bleibt bei jeder Verdünnung exakt gleich."] },
    { prompt: "Ein Fahrzeug fährt mit gleichbleibender Geschwindigkeit doppelt so lange. Wie verändert sich die zurückgelegte Strecke?", answer: "Sie verdoppelt sich.", wrong: ["Sie halbiert sich.", "Sie bleibt gleich.", "Sie vervierfacht sich."] },
    { prompt: "Zwei Lampen sind in Reihe geschaltet. Was passiert, wenn eine Lampe herausgedreht wird?", answer: "Der Stromkreis ist unterbrochen und beide Lampen gehen aus.", wrong: ["Die andere Lampe leuchtet unverändert weiter.", "Die Spannung der Batterie wird null.", "Der Strom fließt durch die Luft weiter."] },
    { prompt: "Bei einer exothermen Reaktion wird mehr Ausgangsstoff zugegeben. Was ist nach einer neuen Gleichgewichtseinstellung zu erwarten?", answer: "Die Produktbildung wird begünstigt.", wrong: ["Es kann grundsätzlich kein Gleichgewicht mehr entstehen.", "Die Reaktion wird zwingend vollständig rückwärts laufen.", "Die Temperatur muss dabei sinken."] },
    { prompt: "Bei gleicher Temperatur und gleichem Druck wird die Stoffmenge eines idealen Gases verdoppelt. Was passiert mit dem Volumen?", answer: "Es verdoppelt sich.", wrong: ["Es halbiert sich.", "Es bleibt gleich.", "Es vervierfacht sich."] },
  ],
  advanced: [
    { prompt: "Bei 12 V fließen durch einen 6-Ω-Widerstand 2 A und durch einen 3-Ω-Widerstand 4 A. Was zeigt dieser Vergleich?", answer: "Bei gleicher Spannung fließt durch den kleineren Widerstand mehr Strom.", wrong: ["Bei gleicher Spannung fließt durch den größeren Widerstand mehr Strom.", "Der Widerstand hat keinen Einfluss auf den Strom.", "Die Spannung am kleineren Widerstand muss halb so groß sein."] },
    { prompt: "Zwei gleich große Wasserproben bekommen gleich viel Wärme. Probe A hat nur halb so viel Wasser wie Probe B. Welche Probe wird wärmer?", answer: "Probe A wird etwa doppelt so stark erwärmt.", wrong: ["Probe B wird etwa doppelt so stark erwärmt.", "Beide werden gleich stark erwärmt.", "Nur die Farbe des Gefäßes entscheidet darüber."] },
    { prompt: "Bei mehr Licht steigt die Fotosynthese. Mehr CO₂ ändert die Rate kaum. Was solltest du als Nächstes testen?", answer: "CO₂ bei mehreren Lichtstärken testen und die Temperatur gleich halten.", wrong: ["Licht und CO₂ gleichzeitig ändern und nur einmal messen.", "Bei jeder Messung auch die Temperatur ändern.", "Nur die Pflanzenfarbe ohne Messwerte vergleichen."] },
    { prompt: "Ein Enzym arbeitet bei pH 7 gut, bei pH 3 aber kaum. Was könnte der Grund sein?", answer: "Der pH-Wert kann die Form des Enzyms und damit seine Arbeit verändern.", wrong: ["Bei pH 3 gibt es grundsätzlich kein Wasser.", "Das Enzym wird bei pH 7 bei jeder Reaktion verbraucht.", "Ein anderer pH-Wert kann nur das Messgerät beeinflussen."] },
    { prompt: "Eine Reaktion gibt Wärme ab. Was passiert mit ihrem Gleichgewicht, wenn du sie erwärmst?", answer: "Es verschiebt sich in die Richtung, die Wärme aufnimmt.", wrong: ["Es verschiebt sich immer in die Richtung, die Wärme abgibt.", "Es verschiebt sich unabhängig von der Reaktion immer zu den Produkten.", "Die Reaktion stoppt dauerhaft."] },
    { prompt: "Ein Gas wird bei gleicher Temperatur auf die Hälfte seines Volumens gedrückt. Wie ändert sich sein Druck?", answer: "Der Druck verdoppelt sich.", wrong: ["Der Druck halbiert sich.", "Der Druck bleibt gleich.", "Der Druck vervierfacht sich."] },
    { prompt: "Eine Probe hat eine Halbwertszeit von 8 Tagen. Wie viel bleibt nach 24 Tagen übrig?", answer: "Ein Achtel, also 12,5 %.", wrong: ["Ein Viertel, also 25 %.", "Die Hälfte, also 50 %.", "Nichts, weil nach drei Halbwertszeiten alles zerfallen ist."] },
    { prompt: "Ein Katalysator beschleunigt eine Reaktion in beide Richtungen. Was ändert sich dadurch?", answer: "Das Gleichgewicht wird schneller erreicht, bleibt aber an derselben Stelle.", wrong: ["Das Gleichgewicht verschiebt sich immer zu den Produkten.", "Das Gleichgewicht verschiebt sich immer zu den Ausgangsstoffen.", "Die Rückreaktion wird dauerhaft verhindert."] },
    { prompt: "Eine Population wächst erst schnell und wird dann kaum noch größer. Was erklärt das am besten?", answer: "Die Umwelt bietet nur begrenzt Platz und Nahrung.", wrong: ["Es gibt immer mehr freie Ressourcen.", "Die Population verdoppelt sich unabhängig von ihrer Größe.", "Jedes Lebewesen hat eine Halbwertszeit."] },
    { prompt: "Ein Körper legt 150 m in 30 s zurück. Welche mittlere Geschwindigkeit ergibt sich?", answer: "5 m/s", wrong: ["0,2 m/s", "120 m/s", "180 m/s"] },
    { prompt: "In einem Reihenstromkreis liegen 12 V an zwei gleichen Widerständen. Wie teilt sich die Spannung idealisiert auf?", answer: "Jeder Widerstand hat 6 V.", wrong: ["Ein Widerstand hat 12 V und der andere 0 V.", "Jeder Widerstand hat 24 V.", "Die Spannung lässt sich in einer Reihenschaltung nicht aufteilen."] },
    { prompt: "Du willst testen, wie Licht und CO₂ die Fotosynthese beeinflussen. Wie findest du heraus, was jeder Faktor bewirkt?", answer: "Immer nur einen Faktor ändern, den anderen gleich halten und mehrmals messen.", wrong: ["Beide Faktoren gleichzeitig ändern und nur einmal messen.", "Bei jeder Messung auch die Temperatur zufällig ändern.", "Nur bei stärkstem Licht messen und daraus alles ableiten."] },
    { prompt: "Mehrere Messungen der Reaktionsgeschwindigkeit sind leicht verschieden. Wie wertest du sie am besten aus?", answer: "Den Mittelwert bilden und die Unterschiede als Unsicherheit beachten.", wrong: ["Nur den höchsten Messwert verwenden.", "Alle leicht abweichenden Werte verwerfen.", "Eine Messung als sicher richtig ansehen und den Rest ignorieren."] },
    { prompt: "Du misst, wie viel Wärme Wasser aufgenommen hat. Welche Angaben brauchst du dafür zusätzlich zur Temperaturänderung?", answer: "Die Wassermenge und wie viel Wärme eine bestimmte Wassermenge aufnimmt.", wrong: ["Nur die Farbe des Gefäßes.", "Nur den pH-Wert des Wassers.", "Nur die Länge des Thermometers."] },
    { prompt: "In einem geschlossenen Gefäß reagieren Stoffe miteinander. Welche Masse bleibt gleich?", answer: "Die Gesamtmasse aller Stoffe zusammen.", wrong: ["Die Masse jedes einzelnen Ausgangsstoffs.", "Die Anzahl der Teilchen jeder einzelnen Stoffart.", "Die Temperatur im Gefäß."] },
  ],
  expert: [
    { prompt: "Zwei Widerstände (6 Ω und 3 Ω) sind parallel an 12 V angeschlossen. Wie viel Strom fließt insgesamt?", answer: "6 A, denn der Ersatzwiderstand beträgt 2 Ω.", wrong: ["2 A, denn parallele Widerstände werden addiert.", "4 A, denn nur der 3-Ω-Zweig führt Strom.", "18 A, denn die Widerstände werden mit der Spannung multipliziert."] },
    { prompt: "0,20 kg Wasser werden um 5 K wärmer. Für Wasser gilt c = 4,2 kJ/(kg·K). Wie viel Wärme nimmt es auf?", answer: "4,2 kJ", wrong: ["0,84 kJ", "2,1 kJ", "21 kJ"] },
    { prompt: "Nach jeder Halbwertszeit bleibt die Hälfte einer Probe übrig. Nach drei solchen Zeiträumen sind noch 12,5 % da. Welche Aussage passt dazu?", answer: "Die Probe zerfällt nach einer gleichbleibenden Halbwertszeit immer weiter.", wrong: ["Die Probe verliert jeden Tag dieselbe Menge.", "Jedes Atom zerfällt genau nach drei Halbwertszeiten.", "Die Halbwertszeit wird nach jedem Zerfall kürzer."] },
    { prompt: "Ein Gas wird von 300 K auf 450 K erwärmt. Menge und Volumen bleiben gleich. Um welchen Faktor steigt der Druck?", answer: "Er steigt um den Faktor 1,5.", wrong: ["Er sinkt auf den Faktor 2/3.", "Er verdoppelt sich.", "Er bleibt gleich, weil das Volumen gleich bleibt."] },
    { prompt: "Ein Enzym arbeitet bei höherer Temperatur erst schneller, dann viel langsamer. Was erklärt beides?", answer: "Wärme beschleunigt die Reaktion zuerst; zu viel Wärme kann die Form des Enzyms verändern.", wrong: ["Nur die Enzymmenge ändert sich und erklärt alles.", "Die Temperatur verändert nur die Farbe des Stoffes.", "Der Abfall zeigt, dass die Reaktion Wärme abgibt."] },
    { prompt: "Ein Modell sagt, dass eine Population immer schneller wächst. In den Messungen wird das Wachstum aber langsamer. Was sollte im Modell ergänzt werden?", answer: "Eine Grenze durch den verfügbaren Platz und die Nahrung.", wrong: ["Eine noch höhere Wachstumsrate.", "Das Weglassen aller Startwerte.", "Eine kürzere Zeitachse ohne Änderung des Modells."] },
    { prompt: "Eine Reaktion gibt Wärme ab. Du erwärmst sie und danach entsteht weniger Produkt. Was erklärt das?", answer: "Die Reaktion verschiebt sich in die Richtung, die Wärme aufnimmt.", wrong: ["Durch Wärme stoppt jede Reaktion vollständig.", "Weniger Produkt entsteht nur, wenn man einen Katalysator entfernt.", "Die Reaktion kann keine Rückrichtung haben."] },
    { prompt: "Ein Modell zeigt: Mehr Licht lässt die Fotosynthese unbegrenzt steigen. Was fehlt dem Modell wahrscheinlich?", answer: "Es beachtet nicht, dass andere Dinge das Wachstum begrenzen können.", wrong: ["Dass Licht Energie liefert.", "Dass Pflanzen CO₂ brauchen.", "Dass die Temperatur eine Rolle spielen kann."] },
    { prompt: "Du änderst Licht und CO₂ gleichzeitig. Danach steigt die Fotosynthese. Warum weißt du nicht, was den Anstieg ausgelöst hat?", answer: "Du hast beide Dinge zugleich verändert und kannst ihre Wirkungen nicht trennen.", wrong: ["Weil man Fotosynthese nicht messen kann.", "Weil zwei Dinge immer denselben Effekt haben.", "Weil eine Kontrollgruppe Messwerte ungültig macht."] },
    { prompt: "Ein 12-V-Netzteil liefert 6 A an eine Last. Welche elektrische Leistung wird umgesetzt?", answer: "72 W", wrong: ["2 W", "18 W", "144 W"] },
    { prompt: "Drei Messungen ergeben 4,8 A, 5,0 A und 5,2 A. Wie groß ist der Durchschnitt, und wie weit liegen die Werte ungefähr davon entfernt?", answer: "Mittelwert 5,0 A; die Streuung beträgt etwa 0,2 A um den Mittelwert.", wrong: ["Mittelwert 4,8 A; Unsicherheit 0 A.", "Mittelwert 5,2 A; die Streuung ist bedeutungslos.", "Mittelwert 15 A; die Werte müssen addiert werden."] },
    { prompt: "Ein Gas wird bei gleicher Temperatur auf ein Drittel seines Volumens gedrückt. Wie ändert sich der Druck?", answer: "Er verdreifacht sich.", wrong: ["Er sinkt auf ein Drittel.", "Er bleibt gleich.", "Er wird neunmal so groß."] },
    { prompt: "25 ml Säure mit 0,2 mol/L sollen mit gleich starker Lauge neutralisiert werden. Wie viel Lauge brauchst du?", answer: "25 ml", wrong: ["12,5 ml", "50 ml", "100 ml"] },
    { prompt: "Ein Modell sagt voraus, dass eine Population bis zu einer festen Grenze K wächst. Was nimmt das Modell dabei über die Umwelt an?", answer: "Platz und Nahrung bleiben langfristig gleich.", wrong: ["Lebewesen können sich nicht fortpflanzen.", "Die Population hat keine feste Grenze.", "Die Population kann nicht auf Nahrung reagieren."] },
    { prompt: "Ein Messwert passt nicht zu dem, was dein Modell vorhersagt. Was solltest du als Nächstes tun?", answer: "Messung und Modell prüfen und den Versuch bei Bedarf wiederholen.", wrong: ["Den Messwert löschen, damit das Modell stimmt.", "Das Modell ungeprüft als exakt richtig ansehen.", "Ohne weitere Prüfung eine andere Ursache behaupten."] },
  ],
};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function hasCompletedDailyQuiz() {
  const [date, profile] = (localStorage.getItem(dailyQuizKey) || "").split("|");
  return date === localDateKey() && profile === learningProfile;
}

function updateDailyQuizButton() {
  dailyQuizButton.textContent = hasCompletedDailyQuiz() ? "Tagesquiz erledigt · nochmal spielen" : "Tagesquiz starten";
}

function getDailyQuestions() {
  const bank = dailyQuestionBank[learningProfile];
  const date = localDateKey().split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(date[0], date[1] - 1, date[2]) / 86400000);
  const dailyCount = 3;
  const firstQuestion = (dayNumber % (bank.length / dailyCount)) * dailyCount;
  return Array.from({ length: dailyCount }, (_, index) => {
    const item = bank[(firstQuestion + index) % bank.length];
    return { ...item, options: uniqueOptions(item.answer, item.wrong), experiment: "Tagesquiz" };
  });
}

updateDailyQuizButton();

const badgeDefinitions = [
  { id: "start", icon: "01", title: "Erster Treffer", text: "Beantworte eine Frage richtig." },
  { id: "school", icon: "02", title: "Schul-Profi", text: "Löse ein Schul-Quiz vollständig richtig." },
  { id: "basic", icon: "03", title: "Grundlagen-Sicher", text: "Löse ein Grundlagen-Quiz vollständig richtig." },
  { id: "advanced", icon: "04", title: "Forscher:in", text: "Löse ein fortgeschrittenes Quiz vollständig richtig." },
  { id: "expert", icon: "05", title: "Expert:in", text: "Löse ein Expert:innen-Quiz vollständig richtig." },
];

function saveQuizProgress() { localStorage.setItem(achievementKey, JSON.stringify(quizProgress)); }

function renderAchievements() {
  achievementSummary.innerHTML = `<div><span>Punkte</span><b>${quizProgress.points}</b></div><div><span>Richtig gelöst</span><b>${quizProgress.solved}</b></div><div><span>Letztes Level</span><b>${quizProgress.lastLevel}</b></div>`;
  achievementBadges.innerHTML = badgeDefinitions.map((badge) => `<article class="achievement-badge ${quizProgress.badges.includes(badge.id) ? "earned" : ""}"><span>${badge.icon}</span><b>${badge.title}</b><small>${badge.text}</small></article>`).join("");
}

function awardQuizAchievements(correct, total) {
  const profile = window.labTeaching.profile();
  quizProgress.points += correct;
  quizProgress.solved += correct;
  quizProgress.lastLevel = window.labTeaching.level();
  if (correct > 0 && !quizProgress.badges.includes("start")) quizProgress.badges.push("start");
  if (correct === total && !quizProgress.badges.includes(profile)) quizProgress.badges.push(profile);
  saveQuizProgress();
  renderAchievements();
}

const schoolQuizFacts = {
  accelerator: "Mehr Spannung gibt dem Teilchen mehr Energie.", electricity: "Weniger Widerstand lässt mehr Strom fließen.", circuitBuilder: "Die Lampe leuchtet nur in einem geschlossenen Stromkreis.", magnetism: "Mehr Strom macht den Elektromagneten stärker.", gravity: "Die Schwerkraft zieht das Objekt zum Planeten.", rocket: "Mehr Schub hilft der Rakete beim Abheben.", drag: "Mehr Luftwiderstand bremst einen fallenden Körper.", waves: "Zwei Wellen können sich verstärken oder abschwächen.", heat: "Wärme fließt vom warmen zum kalten Körper.", collision: "Bei einem Stoß können sich Geschwindigkeit und Richtung ändern.", pendulum: "Kleine Änderungen am Start können später große Unterschiede machen.", blackhole: "Mehr Masse krümmt die Bahn stärker.", optics: "Eine Linse kann Lichtstrahlen an einem Punkt sammeln.", projectile: "Der Abschusswinkel verändert die Flugweite.",
  titration: "Säure und Lauge können zusammen neutral werden.", acidMaterials: "Manche Metalle reagieren mit Säure und bilden Blasen.", kinetics: "Wärme kann eine Reaktion schneller machen.", equilibrium: "Mehr von einem Stoff kann das Gleichgewicht verschieben.", electrolysis: "Strom kann Stoffe in einer Lösung verändern.", gases: "Weniger Platz kann den Druck eines Gases erhöhen.", calorimetry: "Eine Reaktion kann Wasser wärmer oder kälter machen.", solubility: "Wärmeres Wasser kann oft mehr Salz lösen.", redox: "Zwei verschiedene Metalle können Spannung erzeugen.", molecules: "Freie Elektronen können die Form eines Moleküls verändern.", radioactivity: "Mit der Zeit bleiben weniger radioaktive Teilchen übrig.",
  photosynthesis: "Mit Licht kann eine Pflanze Sauerstoff herstellen.", enzymes: "Ein Enzym arbeitet bei passender Temperatur am besten.", osmosis: "Wasser kann in eine Zelle hinein- oder aus ihr herausfließen.", radiation: "Eine Schutzschicht kann Zellen vor Strahlung schützen.", viruses: "Ein Virus kann Zellen in einem Organ schädigen.", muscle: "Training und Erholung zusammen können Muskeln stärker machen.", respiration: "Zellen brauchen Sauerstoff, um Energie zu gewinnen.", population: "Mehr Platz und Nahrung können einer Population beim Wachsen helfen.",
};

function uniqueOptions(correct, alternatives) {
  return [...new Set([correct, ...alternatives.filter((option) => option !== correct)])].slice(0, 4).sort(() => Math.random() - .5);
}

function createQuizQuestions(experiments) {
  const profile = window.labTeaching.profile();
  const count = profile === "school" || profile === "basic" ? 1 : profile === "advanced" ? 2 : 3;
  const allDescriptions = quizExperiments.map((experiment) => experiment.description);
  return experiments.flatMap((experiment) => {
    const schoolQuestion = {
      prompt: `Was stimmt bei „${experiment.title}“?`,
      answer: schoolQuizFacts[experiment.id] || "Du veränderst eine Einstellung und beobachtest, was passiert.",
      options: uniqueOptions(schoolQuizFacts[experiment.id] || "Du veränderst eine Einstellung und beobachtest, was passiert.", quizExperiments.map((item) => schoolQuizFacts[item.id] || "Du veränderst eine Einstellung und beobachtest, was passiert.")),
    };
    const questions = [schoolQuestion, {
      prompt: `Was beschreibt „${experiment.title}“?`,
      answer: experiment.description,
      options: uniqueOptions(experiment.description, allDescriptions),
    }, {
      prompt: `Wie prüfst du fair, was eine Einstellung bei „${experiment.title}“ bewirkt?`,
      answer: "Nur eine Einstellung verändern und die anderen möglichst gleich lassen.",
      options: uniqueOptions("Nur eine Einstellung verändern und die anderen möglichst gleich lassen.", ["Alle Einstellungen gleichzeitig verändern.", "Nur das Bild betrachten und keine Werte vergleichen.", "Die Messung nach jeder Änderung sofort abbrechen."]),
    }, {
      prompt: `Wie wertest du die Ergebnisse zu „${experiment.title}“ sorgfältig aus?`,
      answer: "Mehrere Einstellungen vergleichen und die Grenzen des vereinfachten Modells benennen.",
      options: uniqueOptions("Mehrere Einstellungen vergleichen und die Grenzen des vereinfachten Modells benennen.", ["Ein einzelnes Ergebnis reicht immer aus.", "Messwerte sind weniger wichtig als Vermutungen.", "Das Modell bildet automatisch jede reale Situation exakt ab."]),
    }];
    return (profile === "school" ? [schoolQuestion] : questions.slice(1, count + 1)).map((question) => ({ ...question, experiment: experiment.title }));
  });
}

function openQuiz(subject) {
  dailyQuizQuestionsForRun = null;
  quizTitle.textContent = "Quiz";
  quizExperimentList.hidden = false;
  quizStart.textContent = "Fragen starten";
  const cards = [...document.querySelectorAll(subject === "physics" ? "#experimentCards [data-id]" : subject === "chemistry" ? "#chemistryCards [data-chem-id]" : "#biologyCards [data-bio-id]")];
  quizExperiments = cards.map((card) => ({ id: card.dataset.id || card.dataset.chemId || card.dataset.bioId, title: card.querySelector("b")?.textContent || "Experiment", description: card.querySelector("small")?.textContent || "" }));
  const subjectNames = { physics: "Physik", chemistry: "Chemie", biology: "Biologie" };
  quizSubject.textContent = `${subjectNames[subject]} · ${window.labTeaching.level()}`;
  quizIntro.textContent = "Wähle ein oder mehrere Experimente. Die Fragen passen sich dem Lernmodus vom Startbildschirm an.";
  quizExperimentList.innerHTML = quizExperiments.map((experiment, index) => `<label class="quiz-experiment"><input type="checkbox" value="${experiment.id}" ${index === 0 ? "checked" : ""} />${experiment.title}</label>`).join("");
  quizQuestions.hidden = true; quizQuestions.innerHTML = ""; quizStart.hidden = false; quizCheck.hidden = true; quizResult.hidden = true; quizDialog.hidden = false;
}

function openDailyQuiz() {
  updateDailyQuizButton();
  dailyQuizQuestionsForRun = getDailyQuestions();
  quizTitle.textContent = "Tagesquiz";
  quizSubject.textContent = `Heute · ${window.labTeaching.level()}`;
  quizIntro.textContent = hasCompletedDailyQuiz()
    ? "Du hast die heutigen Fragen bereits gelöst. Du kannst sie zum Üben noch einmal spielen."
    : "Drei neue Fragen passend zu deinem Lernmodus. Morgen wartet eine neue Runde.";
  quizExperimentList.hidden = true;
  quizQuestions.hidden = true;
  quizQuestions.innerHTML = "";
  quizStart.textContent = "Tagesquiz starten";
  quizStart.hidden = false;
  quizCheck.hidden = true;
  quizResult.hidden = true;
  quizDialog.hidden = false;
}

dailyQuizButton.addEventListener("click", openDailyQuiz);
document.querySelectorAll("[data-open-quiz]").forEach((button) => button.addEventListener("click", () => openQuiz(button.dataset.openQuiz)));
document.querySelector("#quizClose").addEventListener("click", () => { quizDialog.hidden = true; });
document.querySelectorAll("[data-open-achievements]").forEach((button) => button.addEventListener("click", () => { renderAchievements(); achievementDialog.hidden = false; }));
document.querySelector("#achievementClose").addEventListener("click", () => { achievementDialog.hidden = true; });
document.querySelector("#achievementReset").addEventListener("click", () => { quizProgress = emptyQuizProgress(); saveQuizProgress(); renderAchievements(); });
quizStart.addEventListener("click", () => {
  if (dailyQuizQuestionsForRun) {
    quizQuestions.innerHTML = dailyQuizQuestionsForRun.map((question, index) => `<fieldset class="quiz-question" data-answer="${question.answer.replaceAll('"', '&quot;')}"><p>${index + 1}. ${question.prompt}</p>${question.options.map((option) => `<label><input type="radio" name="quiz-${index}" value="${option.replaceAll('"', '&quot;')}" />${option}</label>`).join("")}</fieldset>`).join("");
    quizQuestions.hidden = false; quizStart.hidden = true; quizCheck.hidden = false; quizResult.hidden = true;
    return;
  }
  const selectedIds = [...quizExperimentList.querySelectorAll("input:checked")].map((input) => input.value);
  const selectedExperiments = quizExperiments.filter((experiment) => selectedIds.includes(experiment.id));
  if (!selectedExperiments.length) { quizResult.textContent = "Wähle mindestens ein Experiment aus."; quizResult.hidden = false; return; }
  const questions = createQuizQuestions(selectedExperiments);
  quizQuestions.innerHTML = questions.map((question, index) => `<fieldset class="quiz-question" data-answer="${question.answer.replaceAll('"', '&quot;')}"><p>${index + 1}. ${question.prompt}</p>${question.options.map((option) => `<label><input type="radio" name="quiz-${index}" value="${option.replaceAll('"', '&quot;')}" />${option}</label>`).join("")}</fieldset>`).join("");
  quizQuestions.hidden = false; quizStart.hidden = true; quizCheck.hidden = false; quizResult.hidden = true;
});
quizCheck.addEventListener("click", () => {
  const questions = [...quizQuestions.querySelectorAll(".quiz-question")]; let correct = 0;
  questions.forEach((question) => { const answer = question.querySelector("input:checked")?.value; const isCorrect = answer === question.dataset.answer; question.classList.toggle("quiz-correct", isCorrect); question.classList.toggle("quiz-wrong", !isCorrect); question.querySelectorAll("label").forEach((label) => { const option = label.querySelector("input").value; label.classList.toggle("quiz-answer-correct", option === question.dataset.answer); label.classList.toggle("quiz-answer-wrong", option === answer && !isCorrect); }); if (isCorrect) correct += 1; });
  const isDailyQuiz = Boolean(dailyQuizQuestionsForRun);
  const alreadyCompleted = isDailyQuiz && hasCompletedDailyQuiz();
  if (!alreadyCompleted) awardQuizAchievements(correct, questions.length);
  if (isDailyQuiz && !alreadyCompleted) {
    localStorage.setItem(dailyQuizKey, `${localDateKey()}|${learningProfile}|${correct}|${questions.length}`);
    updateDailyQuizButton();
  }
  quizResult.textContent = `${alreadyCompleted ? "Tagesquiz für heute bereits abgeschlossen. " : isDailyQuiz ? "Tagesquiz abgeschlossen! " : ""}${correct} von ${questions.length} Antworten richtig. Lernmodus: ${window.labTeaching.level()}.`;
  quizResult.hidden = false;
});

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
  localStorage.setItem(learningProfileKey, learningProfile);
  document.querySelectorAll("[data-profile]").forEach((item) => item.classList.toggle("active", item === button));
  updateDailyQuizButton();
}));
document.querySelector("#homeButton").addEventListener("click", () => {
  resetExperiment();
  document.querySelector("#labScreen").hidden = true;
  document.querySelector("#homeScreen").hidden = false;
});

const protocolDialog = document.querySelector("#protocolDialog");
const protocolForm = document.querySelector("#protocolForm");
const protocolSubject = document.querySelector("#protocolSubject");
const protocolExperiment = document.querySelector("#protocolExperiment");
const protocolList = document.querySelector("#protocolList");
const protocolKey = "scienceLabProtocols";
const subjectNames = { physics: "Physik", chemistry: "Chemie", biology: "Biologie" };
const protocolCatalog = {
  physics: ["Teilchenbeschleuniger", "Elektrizität", "Stromkreis bauen", "Elektromagnet", "Orbitale Gravitation", "Raketenstart", "Luftwiderstand", "Wasserwellen", "Wärmeübertragung", "Kollisionen", "Doppelpendel", "Schwarzes Loch", "Optik-Labor", "Projektilbewegung"],
  chemistry: ["Säure-Base-Titration", "Säurewirkung auf Materialien", "Reaktionsgeschwindigkeit", "Chemisches Gleichgewicht", "Elektrolyse", "Ideales Gas", "Kalorimetrie", "Löslichkeit", "Redox-Zelle", "Molekülgeometrie", "Radioaktiver Zerfall"],
  biology: ["Photosynthese", "Enzymaktivität", "Osmose", "Strahlenwirkung auf Zellgewebe", "Viren im Organ", "Muskelaufbau", "Zellatmung", "Populationswachstum"],
};
let protocols = JSON.parse(localStorage.getItem(protocolKey) || "[]");

function protocolExperiments(subject) {
  const selector = subject === "physics" ? "#experimentCards [data-id]" : subject === "chemistry" ? "#chemistryCards [data-chem-id]" : "#biologyCards [data-bio-id]";
  const cards = [...document.querySelectorAll(selector)].map((card) => ({ id: card.dataset.id || card.dataset.chemId || card.dataset.bioId, title: card.querySelector("b")?.textContent || "Experiment" }));
  return cards.length ? cards : (protocolCatalog[subject] || []).map((title) => ({ id: title, title }));
}

function setProtocolView(view) {
  document.querySelectorAll("[data-protocol-view]").forEach((button) => button.classList.toggle("active", button.dataset.protocolView === view));
  protocolForm.hidden = view !== "write";
  protocolList.hidden = view !== "list";
  if (view === "list") renderProtocols();
}

function escapeProtocolText(text) { return text.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]); }

function renderProtocols() {
  const sorted = [...protocols].sort((left, right) => `${left.subject}${left.experiment}`.localeCompare(`${right.subject}${right.experiment}`, "de"));
  if (!sorted.length) { protocolList.innerHTML = '<p class="protocol-empty">Noch keine Protokolle gespeichert. Schreibe dein erstes nach einem Experiment.</p>'; return; }
  const groups = sorted.reduce((result, entry) => { const key = `${entry.subject}|${entry.experiment}`; (result[key] ||= []).push(entry); return result; }, {});
  protocolList.innerHTML = Object.entries(groups).map(([key, entries]) => { const [subject, experiment] = key.split("|"); return `<section class="protocol-group"><h3>${subjectNames[subject]} · ${escapeProtocolText(experiment)}</h3>${entries.map((entry) => `<article class="protocol-entry"><small>${escapeProtocolText(entry.date)}</small><p><b>Beobachtung</b>${escapeProtocolText(entry.observations)}</p><p><b>Erkenntnis</b>${escapeProtocolText(entry.findings)}</p></article>`).join("")}</section>`; }).join("");
}

function openProtocols(view) { protocolDialog.hidden = false; setProtocolView(view); }
document.querySelector("#protocolOpen").addEventListener("click", () => openProtocols("write"));
document.querySelector("#protocolListOpen").addEventListener("click", () => openProtocols("list"));
document.querySelector("#protocolClose").addEventListener("click", () => { protocolDialog.hidden = true; });
document.querySelectorAll("[data-protocol-view]").forEach((button) => button.addEventListener("click", () => setProtocolView(button.dataset.protocolView)));
protocolSubject.addEventListener("change", () => { const experiments = protocolSubject.value ? protocolExperiments(protocolSubject.value) : []; protocolExperiment.disabled = !experiments.length; protocolExperiment.innerHTML = `<option value="">Experiment auswählen</option>${experiments.map((experiment) => `<option value="${experiment.title}">${experiment.title}</option>`).join("")}`; });
protocolForm.addEventListener("submit", (event) => { event.preventDefault(); const observations = document.querySelector("#protocolObservations").value.trim(); const findings = document.querySelector("#protocolFindings").value.trim(); protocols.push({ subject: protocolSubject.value, experiment: protocolExperiment.value, observations, findings, date: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date()) }); localStorage.setItem(protocolKey, JSON.stringify(protocols)); protocolForm.reset(); protocolExperiment.disabled = true; protocolExperiment.innerHTML = '<option value="">Zuerst ein Fach auswählen</option>'; const notice = document.querySelector("#protocolNotice"); notice.textContent = "Protokoll gespeichert."; notice.hidden = false; });

const gamesDialog = document.querySelector("#gamesDialog");
const targetBoard = document.querySelector("#targetBoard");
const targetDot = document.querySelector("#targetDot");
const targetScore = document.querySelector("#targetScore");
let targetHits = 0;
let pattern = [];
let patternIndex = 0;
let patternPlaying = false;

function moveTarget() {
  targetDot.style.left = `${8 + Math.random() * (targetBoard.clientWidth - 54)}px`;
  targetDot.style.top = `${8 + Math.random() * (targetBoard.clientHeight - 54)}px`;
}

function showPattern() {
  patternPlaying = true;
  document.querySelector("#patternMessage").textContent = "Muster anschauen ...";
  pattern.forEach((item, index) => window.setTimeout(() => {
    const tile = document.querySelector(`[data-pattern="${item}"]`);
    tile.classList.add("lit");
    window.setTimeout(() => tile.classList.remove("lit"), 340);
  }, 550 * (index + 1)));
  window.setTimeout(() => { patternPlaying = false; document.querySelector("#patternMessage").textContent = "Jetzt bist du dran."; }, 550 * (pattern.length + 1));
}

function startPattern() { pattern = [Math.floor(Math.random() * 4)]; patternIndex = 0; document.querySelector("#patternScore").textContent = "0"; showPattern(); }

document.querySelector("#secretGamesButton").addEventListener("click", () => { gamesDialog.hidden = false; moveTarget(); });
document.querySelector("#gamesClose").addEventListener("click", () => { gamesDialog.hidden = true; });
document.querySelectorAll("[data-game]").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll("[data-game]").forEach((item) => item.classList.toggle("active", item === button)); document.querySelector("#targetGame").hidden = button.dataset.game !== "target"; document.querySelector("#patternGame").hidden = button.dataset.game !== "pattern"; }));
document.querySelector("#targetRestart").addEventListener("click", () => { targetHits = 0; targetScore.textContent = targetHits; moveTarget(); });
targetDot.addEventListener("click", () => { targetHits += 1; targetScore.textContent = targetHits; moveTarget(); });
document.querySelector("#patternStart").addEventListener("click", startPattern);
document.querySelectorAll("[data-pattern]").forEach((tile) => tile.addEventListener("click", () => {
  if (patternPlaying || !pattern.length) return;
  const choice = Number(tile.dataset.pattern);
  if (choice !== pattern[patternIndex]) { document.querySelector("#patternMessage").textContent = "Nicht ganz. Starte ein neues Muster."; pattern = []; return; }
  patternIndex += 1;
  if (patternIndex === pattern.length) { pattern.push(Math.floor(Math.random() * 4)); patternIndex = 0; document.querySelector("#patternScore").textContent = pattern.length - 1; showPattern(); }
}));

for (let index = 0; index < 16; index += 1) {
  const bubble = document.createElement("i");
  bubble.style.left = `${8 + (index * 23) % 78}%`;
  bubble.style.animationDelay = `${(index % 6) * 0.23}s`;
  bubble.style.animationDuration = `${1 + (index % 4) * 0.22}s`;
  document.querySelector("#bubbles").append(bubble);
}

update();