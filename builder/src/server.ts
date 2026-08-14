import * as http from "http";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { generateApp } from "./index";
import { runPipeline } from "./pipeline";
import { run as runRequirementAgent } from "./requirements";

/**
 * Web server front-end for the compiler — the same generateApp the CLI uses.
 * Endpoints:
 *   GET  /health               → { ok: true }
 *   POST /generate             → { ir } → generate → { fileCount, files, outDir }
 *   POST /requirements         → { text } → RequirementAgent (LLM) → { ir, fileCount, files }
 *   POST /generate/from-text   → { text } → RequirementAgent + generate in one call
 */

function json(res: http.ServerResponse, code: number, body: any) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(path.relative(dir, p));
    }
  };
  walk(dir);
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = (req.url ?? "/").split("?")[0];
  try {
    if (req.method === "GET" && url === "/health") return json(res, 200, { ok: true });

    if (req.method === "POST" && url === "/generate") {
      const body = await readBody(req);
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-"));
      const result = generateApp(body.ir ?? body, outDir, body.schemaVersion ?? "1");
      return json(res, 200, { fileCount: result.fileCount, files: listFiles(outDir), outDir, scoring: result.scoring });
    }

    if (req.method === "POST" && url === "/requirements") {
      const body = await readBody(req);
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "req-"));
      const irPath = path.join(outDir, "ir.json");
      const ir = runRequirementAgent(body.text, irPath);
      return json(res, 200, { ir, irPath });
    }

    if (req.method === "POST" && url === "/generate/from-text") {
      const body = await readBody(req);
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-"));
      const irPath = path.join(outDir, "ir.json");
      const ir = runRequirementAgent(body.text, irPath);
      const result = generateApp(ir, path.join(outDir, "app"), ir.schemaVersion ?? "1");
      return json(res, 200, { ir, fileCount: result.fileCount, files: listFiles(path.join(outDir, "app")), scoring: result.scoring });
    }

    if (req.method === "POST" && url === "/generate/full") {
      const body = await readBody(req);
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "full-"));
      const irPath = path.join(outDir, "ir.json");
      fs.writeFileSync(irPath, JSON.stringify(body.ir ?? body, null, 2));
      const report = runPipeline(body.ir ?? body, path.join(outDir, "app"), irPath);
      return json(res, report.passed ? 200 : 422, report);
    }

    return json(res, 404, { error: "not found" });
  } catch (e) {
    return json(res, 400, { error: (e as Error).message });
  }
});

const port = Number(process.env.PORT ?? 8787);
server.listen(port, () => console.log(`[server] Flutter app builder listening on http://localhost:${port}`));
