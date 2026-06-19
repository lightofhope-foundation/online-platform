/**
 * Canonical LOH video catalog from videostruktur.md.
 * Used by seed script and topic-aware course ordering.
 */

export const LOH_COURSE_SLUG = "loh-therapiepfad";
export const LOH_PLACEHOLDER_BUNNY_ID = "d168378a-3b92-4e8b-8b7a-0d8d5a2a89c8";

export type LohBoardSlug =
  | "intro_emotionen"
  | "intro_eigenverantwortung"
  | "intro_identitaet_trauma"
  | "intro_biohacking"
  | "trennung"
  | "selbstliebe"
  | "traumata"
  | "anxiety"
  | "depression"
  | "wutprobleme"
  | "beziehung";

export type LohChapterDef = {
  boardSlug: LohBoardSlug;
  title: string;
  isIntro: boolean;
  videos: string[];
};

export const LOH_TOPIC_BOARD_SEQUENCES: Record<string, LohBoardSlug[]> = {
  trennung: ["trennung", "selbstliebe", "traumata", "anxiety", "depression", "wutprobleme", "beziehung"],
  beziehung: ["beziehung", "selbstliebe", "traumata", "anxiety", "wutprobleme", "depression", "trennung"],
  anxiety: ["anxiety", "traumata", "selbstliebe", "beziehung", "depression", "wutprobleme", "trennung"],
  depression: ["depression", "selbstliebe", "traumata", "anxiety", "wutprobleme", "beziehung", "trennung"],
  trauma: ["traumata", "anxiety", "selbstliebe", "wutprobleme", "depression", "beziehung", "trennung"],
  wut: ["wutprobleme", "traumata", "selbstliebe", "anxiety", "depression", "beziehung", "trennung"],
};

export const DEFAULT_LOH_TOPIC = "trennung";

/** Storage order: 4 intro chapters + 7 boards (trennung sequence). */
export const LOH_CHAPTERS: LohChapterDef[] = [
  {
    boardSlug: "intro_emotionen",
    title: "Das Wunder hinter Emotionen",
    isIntro: true,
    videos: [
      "Einführung in die Welt der Gefühle",
      "Wie Emotionen zur Manipulation führen können",
      "Den Weg zur aktiven Emotionsgestaltung",
      "Einführung in die Bewusstseinsebenen",
      "Die tiefe Symbolik der Bewusstseinsebenen",
      "Warum ein narratives Verständnis hilft",
      "Von der Dauerpräsenz zur Erinnerung",
      "Vom Chaos zur Ordnung: Sinn finden",
    ],
  },
  {
    boardSlug: "intro_eigenverantwortung",
    title: "Die Kraft der Eigenverantwortung",
    isIntro: true,
    videos: [
      "Dem nächsten Schritt wagen - vom Verstehen zum tun.",
      "Unterstützung und nachhaltige Veränderung",
      "Die Verwirrung rund um Motivation",
      "Widerstände verstehen und die Kraft der Gefühle nutzen",
      "Weshalb kommen wir nicht in die Gänge",
      "Die versteckten Emotionen verstehen und emotionale Widerstände überwinden",
      "Emotionale Widerstände überwinden und nachhaltige Veränderungen umsetzen",
      "Motivation nachhaltig stärken (Platzhalter)",
    ],
  },
  {
    boardSlug: "intro_identitaet_trauma",
    title: "Persönlichkeit, Identität und Trauma",
    isIntro: true,
    videos: [
      "Einleitung: Wer bin ich – und warum ist das wichtig?",
      "Was passiert in der Kindheit?",
      "Das Default Mode Network und der innere Kritiker",
      "Wie funktionieren „korrigierende Erfahrungen“",
      "Warum wir über Persönlichkeit und Identität sprechen",
      "Die Macht unserer Erfahrungen",
      "Das Prinzip der Exposition",
      "Was sind Kernüberzeugungen?",
    ],
  },
  {
    boardSlug: "intro_biohacking",
    title: "Bio Hacking",
    isIntro: true,
    videos: [
      "Bausteine für dein Gehirn: Ernährung, Schlaf und Bewegung",
      "Alte Ideen, neue Perspektiven",
      "Wie Nährstoffe uns stärken",
      "Der Darm im Fokus",
      "Wenn Bakterien die Burg stürmen",
      "Kräutermedizin",
      "Kräuter bei Depression",
    ],
  },
  {
    boardSlug: "trennung",
    title: "Trennung",
    isIntro: false,
    videos: [
      "Dein persönlicher Breakup-Kompass",
      "Altlasten raus – Frischer Wind rein",
      "Selbstfürsorge und Neuausrichtung",
      "Vom Breakup zum Durchbruch – Dein Weg nach vorn",
      "Der Moment, in dem alles zusammenbrichticht",
      "Über Erinnerungsstücke und emotionale Museen",
      "Willkommen zum dritten Schritt – Disziplinierte Gedanken",
      "Der letzte Schritt – Fokus auf dich selbst",
      "Wenn eine Beziehung endet",
      "Den Kern des Trennungsschmerzes erkennen",
      "Authentisch Sein und Neu Starten",
      "Verstehen und Loslassen",
      "Heilung und Neubeginn",
    ],
  },
  {
    boardSlug: "selbstliebe",
    title: "Selbstliebe",
    isIntro: false,
    videos: [
      "Warum Selbstliebe so bedeutsam ist",
      "Authentische Wertschätzung statt falsches Lob",
      "Der seltsame Fall des menschlichen Selbsthasses",
    ],
  },
  {
    boardSlug: "traumata",
    title: "Traumata",
    isIntro: false,
    videos: [
      "Intro Into Trauma",
      "Deine Geschichte verdient einen neuen Rahmen",
      "Overview of Trauma",
      "Core Sequence of Trauma",
      "Somatic Illness #1",
      "Somatic Illness#2",
      "Somatic Illness #3",
      "Somatic Illness #4",
      "Physiologic Rewiring #1",
      "Physiologic Rewiring #2",
      "Einführung in das Konzept des Posttraumatischen Wachstums",
      "Wertschätzung des Lebens & Neue Möglichkeiten",
      "Verbundenheit & Persönliche Stärke",
      "Spirituelle Veränderung & Zusammenfassung",
      "Verarbeitung der Samskaras",
    ],
  },
  {
    boardSlug: "anxiety",
    title: "Anxiety",
    isIntro: false,
    videos: [
      "Was genau ist Angst",
      "Warum scheint Angst heute allgegenwärtig?",
      "Wie Angst sich in unseren Gedanken verankert",
      "Ein ganzheitlicher Ansatz gegen Angst",
      "Warum wir mehr als nur den Kopf betrachten sollten",
      "Cortisol – der Marathonläufer unter den Stresshormonen",
      "Die Wechselwirkung zwischen Atmung und Geist",
      "Was ist normale Angst und wann wird sie zur Störung?",
      "Angst – Mehr als nur ein Begriff",
      "Die Angst-Landschaft",
      "Langfristige Strategien",
      "„Schichten“ der Angst",
      "Die gelernte Angst",
      "Die unterschiedlichen Wurzeln der Angst",
      "Verschiedene Zustände des Geistes",
      "Die zwei Pfeile nach alter Lehre",
      "Der Kampf gegen die Angst",
      "Rückfälle und wie man damit umgeht",
      "Lösungsansätze",
      "Das Ego auf den Prüfstand stellen",
    ],
  },
  {
    boardSlug: "depression",
    title: "Depression",
    isIntro: false,
    videos: [
      "Was bedrückt dich wirklich ?",
      "Wie dein Kopf tickt",
      "Willkommen in der Welt der Neurowissenschaft",
      "Dein Kopf, dein Kino",
      "Die Differentialdiagnose",
      "Pizza nicht gleich Pizza",
      "Die Umstandsdepression",
      "Umstandsdepression als Signal",
      "Wie Depression unser Denken verändert",
      "Warum haben wir eigentlich negative Emotionen ?",
      "Die selbst erfüllende Prophezeiung",
      "Die Bedingte Liebe",
      "The Fantasy Trap",
    ],
  },
  {
    boardSlug: "wutprobleme",
    title: "Wutprobleme",
    isIntro: false,
    videos: [
      "Gesunde Wut und Ungesunde Wut",
      "Was passiert, wenn Wut unterschwellig brodelt",
      "Unterdrückte Wut 2.0",
      "Warum sich Wut so hartnäckig hält",
      "Wenn Beziehungen zum Pulverfass werden",
      "Emotionale Nüchternheit – was ist das?",
      "Wut bewusst transformieren (Platzhalter)",
    ],
  },
  {
    boardSlug: "beziehung",
    title: "Beziehung",
    isIntro: false,
    videos: [
      "Beziehungen und psychische Gesundheit",
      "Was ist emotionale Spiegelung?",
      "Wozu brauchen wir Emotionsregulation?",
      "Beziehungsmuster erkennen (Platzhalter)",
      "Bindungstheorie und Beziehungen",
      "sicheren und den ängstlich-ambivalenten",
      "vermeidenden (avoidant) Stil—und",
      "Emotionale Regulation",
      "Authentizität in Beziehungen – Die Falle des Perfekten Partners",
      "Selbstwert und Freiheit",
      "Bedeutung der Ehe",
      "Sex vor der Ehe und seiner Konsequenzen.",
      "Sex als Grundpfeiler der Intimität",
      "Der sichere Bindungsstil und Sex",
      "Trauma und unsere Sexualität",
      "Die Lösung unserer Bindungsmustern",
    ],
  },
];

export function countLohVideos(): number {
  return LOH_CHAPTERS.reduce((sum, ch) => sum + ch.videos.length, 0);
}
