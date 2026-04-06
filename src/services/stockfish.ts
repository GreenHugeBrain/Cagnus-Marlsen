export interface EngineLine {
  depth: number;
  score: number; // Centipawns, positive for white advantage
  mate: number | null; // Moves to mate, positive for white
  pv: string[]; // Principal variation (array of SAN or UCI moves)
}

export type EngineCallback = (evaluation: {
  score: number;
  mate: number | null;
  lines: EngineLine[];
  depth: number;
}) => void;

export class StockfishEngine {
  private worker: Worker | null = null;
  private callback: EngineCallback | null = null;
  private currentLines: Map<number, EngineLine> = new Map();
  private isReady = false;
  private isAnalyzing = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Using a reliable CDN for stockfish.js
      const workerBlob = new Blob([
        `importScripts("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");`
      ], { type: 'application/javascript' });
      
      this.worker = new Worker(URL.createObjectURL(workerBlob));
      
      this.worker.onmessage = (e) => this.handleMessage(e.data);
      this.sendCommand('uci');
    } catch (e) {
      console.error('Failed to initialize Stockfish worker', e);
    }
  }

  private sendCommand(cmd: string) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  private handleMessage(msg: string) {
    if (msg === 'uciok') {
      this.isReady = true;
      this.sendCommand('setoption name MultiPV value 3');
      this.sendCommand('isready');
    }

    if (msg.startsWith('info depth')) {
      this.parseInfo(msg);
    }
  }

  private parseInfo(msg: string) {
    const depthMatch = msg.match(/depth (\d+)/);
    const multipvMatch = msg.match(/multipv (\d+)/);
    const scoreMatch = msg.match(/score cp (-?\d+)/);
    const mateMatch = msg.match(/score mate (-?\d+)/);
    const pvMatch = msg.match(/ pv (.*)/);

    if (!depthMatch || !multipvMatch) return;

    const depth = parseInt(depthMatch[1], 10);
    const multipv = parseInt(multipvMatch[1], 10);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    const mate = mateMatch ? parseInt(mateMatch[1], 10) : null;
    const pv = pvMatch ? pvMatch[1].split(' ') : [];

    const line: EngineLine = { depth, score, mate, pv };
    this.currentLines.set(multipv, line);

    if (this.callback && this.currentLines.size > 0) {
      const lines = Array.from(this.currentLines.values()).sort((a, b) => {
        if (a.mate !== null && b.mate !== null) return Math.abs(a.mate) - Math.abs(b.mate);
        if (a.mate !== null) return a.mate > 0 ? -1 : 1;
        if (b.mate !== null) return b.mate > 0 ? 1 : -1;
        return b.score - a.score;
      });

      const bestLine = lines[0];
      this.callback({
        score: bestLine.score,
        mate: bestLine.mate,
        lines,
        depth
      });
    }
  }

  public analyzePosition(fen: string, callback: EngineCallback, depth: number = 15) {
    this.callback = callback;
    this.currentLines.clear();
    
    if (this.isAnalyzing) {
      this.sendCommand('stop');
    }
    
    this.isAnalyzing = true;
    this.sendCommand('ucinewgame');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);
  }

  public setMultiPv(lines: number) {
    this.sendCommand(`setoption name MultiPV value ${lines}`);
  }

  public stop() {
    this.sendCommand('stop');
    this.isAnalyzing = false;
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
