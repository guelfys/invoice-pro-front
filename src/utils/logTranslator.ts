export type UiLevel = "info" | "success" | "warning" | "error";

export type UiItem = {
  level: UiLevel;
  title: string;
  detail?: string;
  meta?: any;
};

export type UiTranslation = {
  status: "idle" | "running" | "done" | "error";
  progress: number; 
  timeline: UiItem[];
  results: UiItem[]; 
  sanitizedLog: string;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function formatDateLike(s: string) {
  const t = (s || "").trim();
  if (/^\d{8}$/.test(t)) return `${t.slice(6, 8)}/${t.slice(4, 6)}/${t.slice(0, 4)}`;
  return t;
}

const reStart = /Iniciando/i;
const reReadExcel = /Leyendo Excel/i;
const reBuild = /(Armando|Construyendo).*(cuerpo|requests|solicitud)/i;
const reSend = /(Enviando|Solicitando).*(CAE|AFIP|WSFE|MTXCA)/i;
const rePdf = /(PDF|armado_pdf|convertir_xlsx_a_pdf|Generando.*PDF)/i;
const reFinish = /(Proceso finalizado|Finaliz(ó|o)|Terminad[oa])/i;
const reError = /(Traceback|ERROR|Exception|ModuleNotFoundError)/i;

const reCae = /CAE obtenido:\s*(\d+)\s*\|\s*Vto:\s*([0-9\/-]+)/i;

const reResponseStart = /Respuesta del servicio:/i;

function stripSensitiveBlocks(raw: string) {
  return raw.replace(/\r/g, "");
}

type CodeDesc = { code: number; desc: string };

function mapCodes(arr: any[]): CodeDesc[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x: any) => ({
      code: Number(x?.codigo ?? x?.code ?? NaN),
      desc: String(x?.descripcion ?? x?.desc ?? ""),
    }))
    .filter((x: CodeDesc) => Number.isFinite(x.code) && x.desc);
}

function parsePythonDictToObject(text: string): any | null {
  const normalized = text
    .replace(
      /\bdatetime\.date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)/g,
      (_m, y, mo, d) => {
        const mm = String(mo).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `"${dd}/${mm}/${y}"`;
      }
    )
    .replace(/\bNone\b/g, "null")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false");

  const jsonish = normalized
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .replace(/'/g, '"');

  try {
    return JSON.parse(jsonish);
  } catch {
    return null;
  }
}

function findRequestNumbers(raw: string) {
  const m = /Comprobante\s+(\d+)/i.exec(raw);
  return m ? Number(m[1]) : undefined;
}

function parseResponseBlock(text: string, requestNumbers: number[]): UiItem | null {
  const parsed = parsePythonDictToObject(text);

  const resultado =
    String(parsed?.resultado ?? "").toUpperCase() ||
    (/'resultado'\s*:\s*'([A-Z])'/i.exec(text)?.[1] || "").toUpperCase();

  const obsRaw = parsed?.arrayObservaciones?.codigoDescripcion ?? [];
  const errRaw = parsed?.arrayErrores?.codigoDescripcion ?? [];

  const resp = parsed?.comprobanteResponse ?? null;

  const nro =
    (resp && (resp.numeroComprobante ?? resp.nro ?? null)) ??
    (requestNumbers.length ? requestNumbers[requestNumbers.length - 1] : null);

  const label = nro != null ? `Comprobante ${nro}` : "Comprobante";

  const cae = resp?.CAE ? String(resp.CAE) : (/"CAE"\s*:\s*(\d+)/.exec(text)?.[1] || "");
  const vto = resp?.fechaVencimientoCAE ? String(resp.fechaVencimientoCAE) : "";
  const caeLine = cae ? `CAE ${cae}${vto ? ` (vto ${formatDateLike(vto)})` : ""}.` : "";

  const obs = mapCodes(obsRaw);
  const errs = mapCodes(errRaw);

  if (errs.length || resultado === "R") {
    const detail = errs.slice(0, 3).map(e => `Código ${e.code}: ${e.desc}`).join(" · ");
    return {
      level: "error",
      title: `${label} rechazado`,
      detail: detail || "El comprobante fue rechazado por AFIP.",
      meta: { nro, errors: errs },
    };
  }

  if (obs.length || resultado === "O") {
    return {
      level: "success",
      title: `${label} autorizado`,
      detail: caeLine || "Autorizado correctamente.",
      meta: { nro, observations: obs, cae, vto },
    };
  }

  if (resultado === "A" || (resp && cae)) {
    return {
      level: "success",
      title: `${label} autorizado`,
      detail: caeLine || "Autorizado correctamente.",
      meta: { nro, cae, vto },
    };
  }

  return null;
}

export function translateJobLog(raw: string): UiTranslation {
  const clean = stripSensitiveBlocks(raw);
  const safeLines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let status: UiTranslation["status"] = "idle";
  let progress = 0;

  const timeline: UiItem[] = [];
  const results: UiItem[] = [];

  let capturing = false;
  let blockBuf: string[] = [];
  let fallbackNro: number | undefined;

  for (const line of safeLines) {
    if (reError.test(line)) {
      status = "error";
      progress = 100;
      timeline.push({
        level: "error",
        title: "Ocurrió un error",
        detail: "El proceso se detuvo por un problema interno. Revisá la configuración e intentá nuevamente.",
      });
      continue;
    }

    if (reStart.test(line)) {
      status = "running";
      progress = Math.max(progress, 5);
      timeline.push({ level: "info", title: "Iniciando", detail: "Preparando la generación de comprobantes..." });
      continue;
    }

    if (reReadExcel.test(line)) {
      status = "running";
      progress = Math.max(progress, 15);
      timeline.push({ level: "info", title: "Leyendo archivo", detail: "Procesando el Excel de comprobantes..." });
      continue;
    }

    if (reBuild.test(line)) {
      status = "running";
      progress = Math.max(progress, 35);
      timeline.push({ level: "info", title: "Preparando comprobantes", detail: "Armando la información para enviar a AFIP..." });
      continue;
    }

    if (reSend.test(line)) {
      status = "running";
      progress = Math.max(progress, 55);
      timeline.push({ level: "info", title: "Enviando a AFIP", detail: "Solicitando autorización (CAE)..." });
      continue;
    }

    const caeM = reCae.exec(line);
    if (caeM) {
      status = "running";
      progress = Math.max(progress, 75);
      timeline.push({
        level: "info",
        title: "CAE obtenido",
        detail: `CAE ${caeM[1]} (vto ${formatDateLike(caeM[2])}).`,
      });
      continue;
    }

    if (rePdf.test(line)) {
      status = "running";
      progress = Math.max(progress, 90);
      timeline.push({ level: "info", title: "Generando archivos", detail: "Armando comprobantes (PDF)..." });
      continue;
    }

    if (reFinish.test(line)) {
      status = "done";
      progress = 100;
      timeline.push({ level: "success", title: "Proceso finalizado", detail: "Listo. Revisá los resultados." });
      continue;
    }

    // === Captura WS response ===
    if (!capturing && reResponseStart.test(line)) {
      capturing = true;
      blockBuf = [line];
      fallbackNro = findRequestNumbers(line);
      continue;
    }

    if (capturing) {
      blockBuf.push(line);

      const maybeNro = findRequestNumbers(line);
      if (maybeNro != null) fallbackNro = maybeNro;

      const maybeClosed = /}\s*,?\s*$/.test(line) || /}\s*$/.test(line);

      if (maybeClosed) {
        capturing = false;

        const block = blockBuf.join("\n");
        const parsedItem = parseResponseBlock(block, fallbackNro != null ? [fallbackNro] : []);
        if (parsedItem) {
          results.push(parsedItem);
          progress = Math.max(progress, 80);
        }

        blockBuf = [];
        fallbackNro = undefined;
      }
    }
  }

  return {
    status,
    progress: clamp(progress),
    timeline,
    results,
    sanitizedLog: clean,
  };
}
