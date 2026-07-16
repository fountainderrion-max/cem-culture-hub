import path from "path";
import { existsSync, promises as fs } from "fs";

const DEFAULT_FILE = path.join(process.cwd(), "data", "culture-lanes.json");

export class CultureLaneRepository {
  constructor(filePath = process.env.CULTURE_LANE_STORE_FILE || DEFAULT_FILE) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async load() {
    if (!existsSync(this.filePath)) return { lanes: [], commands: [] };
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, "utf8"));
      return {
        lanes: Array.isArray(parsed.lanes) ? parsed.lanes : [],
        commands: Array.isArray(parsed.commands) ? parsed.commands : []
      };
    } catch {
      return { lanes: [], commands: [] };
    }
  }

  async save(snapshot) {
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const temporary = `${this.filePath}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(snapshot, null, 2), "utf8");
      await fs.rename(temporary, this.filePath);
    });
    return this.writeQueue;
  }
}
