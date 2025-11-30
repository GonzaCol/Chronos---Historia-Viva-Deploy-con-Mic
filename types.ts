export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  scenePrompt?: string; // The extracted prompt for image generation
  contextInfo?: string; // Extracted location/time metadata
  imageUrl?: string; // The URL of the generated image associated with this message
  isImageLoading?: boolean;
  audioData?: string; // Base64 audio data for TTS
  isAudioLoading?: boolean;
}

export interface SessionConfig {
  character: string;
  date: string;
  voiceGender?: 'MALE' | 'FEMALE';
}

export interface SavedSession {
  id: string;
  config: SessionConfig;
  messages: Message[];
  lastModified: number; // timestamp
}

export enum AppState {
  SETUP,
  ACTIVE,
  ERROR
}

export type Language = 'es' | 'en' | 'fr' | 'de' | 'ja';

export const TRANSLATIONS = {
  es: {
    systemStatus: 'SISTEMA EN LÍNEA // LISTO PARA SINC',
    newSync: 'NUEVA SINC',
    archives: 'ARCHIVOS',
    targetSubject: 'Sujeto Objetivo',
    quickSelect: 'Selección Rápida',
    identifyPlaceholder: 'IDENTIFICAR FIGURA HISTÓRICA...',
    temporalCoordinates: 'Coordenadas Temporales',
    datePlaceholder: 'ESPECIFICAR FECHA / ERA...',
    lifespanDetected: 'PERIODO DETECTADO',
    adjustFlux: 'Ajustar Flujo Temporal',
    initialize: 'INICIAR SECUENCIA',
    noArchives: 'No se encontraron archivos de memoria',
    blocks: 'Bloques',
    loadSim: 'Cargar Simulación',
    deleteArchive: 'Borrar Archivo',
    terminate: 'TERMINAR',
    simulationActive: 'SIMULACIÓN ACTIVA',
    decrypting: 'DESCIFRANDO FLUJO DE DATOS...',
    transmitPlaceholder: 'Transmitir mensaje a',
    dictate: 'Dictar voz',
    memBlockOffline: 'Bloque de Memoria Offline',
    waitingSync: 'Esperando sincronización...',
    rendering: 'Renderizando Secuencia...',
    visualCortex: 'Salida de Corteza Visual',
    errorTitle: 'FALLO CRÍTICO',
    errorDesc: 'Sincronización Temporal Perdida.',
    returnMenu: 'VOLVER AL MENÚ',
    playing: 'REPRODUCIENDO',
    audio: 'AUDIO'
  },
  en: {
    systemStatus: 'SYSTEM ONLINE // READY FOR SYNC',
    newSync: 'NEW SYNC',
    archives: 'ARCHIVES',
    targetSubject: 'Target Subject',
    quickSelect: 'Quick Select',
    identifyPlaceholder: 'IDENTIFY HISTORICAL FIGURE...',
    temporalCoordinates: 'Temporal Coordinates',
    datePlaceholder: 'SPECIFY DATE / ERA...',
    lifespanDetected: 'LIFESPAN DETECTED',
    adjustFlux: 'Adjust Temporal Flux',
    initialize: 'INITIALIZE SEQUENCE',
    noArchives: 'No Memory Archives Found',
    blocks: 'Blocks',
    loadSim: 'Load Simulation',
    deleteArchive: 'Delete Archive',
    terminate: 'TERMINATE',
    simulationActive: 'SIMULATION ACTIVE',
    decrypting: 'DECRYPTING DATA STREAM...',
    transmitPlaceholder: 'Transmit message to',
    dictate: 'Dictate voice',
    memBlockOffline: 'Memory Block Offline',
    waitingSync: 'Waiting for synchronization...',
    rendering: 'Rendering Sequence...',
    visualCortex: 'Visual Cortex Output',
    errorTitle: 'CRITICAL FAILURE',
    errorDesc: 'Temporal Synchronization Lost.',
    returnMenu: 'RETURN TO MENU',
    playing: 'PLAYING',
    audio: 'AUDIO'
  },
  fr: {
    systemStatus: 'SYSTÈME EN LIGNE // PRÊT POUR SYNC',
    newSync: 'NOUVELLE SYNC',
    archives: 'ARCHIVES',
    targetSubject: 'Sujet Cible',
    quickSelect: 'Sélection Rapide',
    identifyPlaceholder: 'IDENTIFIER FIGURE HISTORIQUE...',
    temporalCoordinates: 'Coordonnées Temporelles',
    datePlaceholder: 'SPÉCIFIER DATE / ÈRE...',
    lifespanDetected: 'DURÉE DE VIE DÉTECTÉE',
    adjustFlux: 'Ajuster Flux Temporel',
    initialize: 'INITIALISER SÉQUENCE',
    noArchives: 'Aucune archive mémoire trouvée',
    blocks: 'Blocs',
    loadSim: 'Charger Simulation',
    deleteArchive: 'Supprimer Archive',
    terminate: 'TERMINER',
    simulationActive: 'SIMULATION ACTIVE',
    decrypting: 'DÉCRYPTAGE DU FLUX DE DONNÉES...',
    transmitPlaceholder: 'Transmettre message à',
    dictate: 'Dicter la voix',
    memBlockOffline: 'Bloc Mémoire Hors Ligne',
    waitingSync: 'En attente de synchronisation...',
    rendering: 'Rendu de la Séquence...',
    visualCortex: 'Sortie Cortex Visuel',
    errorTitle: 'ÉCHEC CRITIQUE',
    errorDesc: 'Synchronisation Temporelle Perdue.',
    returnMenu: 'RETOURNER AU MENU',
    playing: 'LECTURE',
    audio: 'AUDIO'
  },
  de: {
    systemStatus: 'SYSTEM ONLINE // BEREIT FÜR SYNC',
    newSync: 'NEUE SYNC',
    archives: 'ARCHIVE',
    targetSubject: 'Zielperson',
    quickSelect: 'Schnellauswahl',
    identifyPlaceholder: 'HISTORISCHE FIGUR IDENTIFIZIEREN...',
    temporalCoordinates: 'Zeitkoordinaten',
    datePlaceholder: 'DATUM / ÄRA ANGEBEN...',
    lifespanDetected: 'LEBENSDAUER ERKANNT',
    adjustFlux: 'Zeitfluss Anpassen',
    initialize: 'SEQUENZ INITIALISIEREN',
    noArchives: 'Keine Speicherarchive gefunden',
    blocks: 'Blöcke',
    loadSim: 'Simulation Laden',
    deleteArchive: 'Archiv Löschen',
    terminate: 'BEENDEN',
    simulationActive: 'SIMULATION AKTIV',
    decrypting: 'DATENSTROM WIRD ENTSCHLÜSSELT...',
    transmitPlaceholder: 'Nachricht senden an',
    dictate: 'Sprache diktieren',
    memBlockOffline: 'Speicherblock Offline',
    waitingSync: 'Warte auf Synchronisation...',
    rendering: 'Sequenz wird gerendert...',
    visualCortex: 'Visueller Kortex Ausgang',
    errorTitle: 'KRITISCHER FEHLER',
    errorDesc: 'Zeitsynchronisation Verloren.',
    returnMenu: 'ZURÜCK ZUM MENÜ',
    playing: 'WIEDERGABE',
    audio: 'AUDIO'
  },
  ja: {
    systemStatus: 'システムオンライン // 同期準備完了',
    newSync: '新規同期',
    archives: 'アーカイブ',
    targetSubject: '対象人物',
    quickSelect: 'クイック選択',
    identifyPlaceholder: '歴史上の人物を特定...',
    temporalCoordinates: '時間座標',
    datePlaceholder: '日付 / 時代を指定...',
    lifespanDetected: '生存期間検出',
    adjustFlux: '時間フラックス調整',
    initialize: 'シーケンス開始',
    noArchives: 'メモリアーカイブが見つかりません',
    blocks: 'ブロック',
    loadSim: 'シミュレーション読込',
    deleteArchive: 'アーカイブ削除',
    terminate: '終了',
    simulationActive: 'シミュレーション中',
    decrypting: 'データストリーム解読中...',
    transmitPlaceholder: 'メッセージ送信先：',
    dictate: '音声入力',
    memBlockOffline: 'メモリブロック オフライン',
    waitingSync: '同期待機中...',
    rendering: 'シーケンスレンダリング中...',
    visualCortex: '視覚野出力',
    errorTitle: '致命的なエラー',
    errorDesc: '時間同期が失われました。',
    returnMenu: 'メニューに戻る',
    playing: '再生中',
    audio: '音声'
  }
};