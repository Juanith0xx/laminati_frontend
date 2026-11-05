/* =========================================
   SERVICIO DE CORTE HPL
   Laminatiword - Cotización de baños

   Calcula operaciones de corte a partir de la
   distribución REAL devuelta por el optimizador.

   Regla:
   - Sólo se cuentan aristas internas de las piezas.
   - Aristas paralelas separadas por el kerf se
     consideran un mismo corte de sierra.
   - Segmentos colineales contiguos se consolidan.
========================================= */

const DEFAULT_KERF = 4;
const POSITION_TOLERANCE = 0.75;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getOptimizationData = (response) =>
  response?.data?.materials
    ? response.data
    : response?.materials
      ? response
      : null;

const closeTo = (a, b, tolerance = POSITION_TOLERANCE) =>
  Math.abs(toNumber(a) - toNumber(b)) <= tolerance;

const mergeIntervals = (intervals, gapTolerance) => {
  const sorted = intervals
    .map(({ start, end }) => ({
      start: Math.min(toNumber(start), toNumber(end)),
      end: Math.max(toNumber(start), toNumber(end)),
    }))
    .filter(({ end, start }) => end - start > POSITION_TOLERANCE)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (sorted.length === 0) return [];

  const merged = [{ ...sorted[0] }];

  for (const current of sorted.slice(1)) {
    const previous = merged[merged.length - 1];

    if (current.start <= previous.end + gapTolerance) {
      previous.end = Math.max(previous.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
};

const countGroupedEdges = (edges, gapTolerance) => {
  if (edges.length === 0) return 0;

  const sorted = [...edges].sort(
    (a, b) => a.position - b.position || a.start - b.start
  );

  const groups = [];

  for (const edge of sorted) {
    const previous = groups[groups.length - 1];

    if (
      previous &&
      Math.abs(edge.position - previous.positionMax) <= gapTolerance
    ) {
      previous.positionMax = Math.max(previous.positionMax, edge.position);
      previous.intervals.push({ start: edge.start, end: edge.end });
    } else {
      groups.push({
        positionMin: edge.position,
        positionMax: edge.position,
        intervals: [{ start: edge.start, end: edge.end }],
      });
    }
  }

  return groups.reduce(
    (total, group) =>
      total + mergeIntervals(group.intervals, gapTolerance).length,
    0
  );
};

const countCutsForPlacements = ({
  placements = [],
  sheetWidth,
  sheetHeight,
  kerf = DEFAULT_KERF,
}) => {
  const width = toNumber(sheetWidth);
  const height = toNumber(sheetHeight);
  const normalizedKerf = Math.max(toNumber(kerf, DEFAULT_KERF), 0);
  const gapTolerance = normalizedKerf + POSITION_TOLERANCE;

  if (width <= 0 || height <= 0 || !Array.isArray(placements)) {
    return {
      verticalCuts: 0,
      horizontalCuts: 0,
      cutCount: 0,
    };
  }

  const verticalEdges = [];
  const horizontalEdges = [];

  for (const placement of placements) {
    const x = toNumber(placement?.x);
    const y = toNumber(placement?.y);
    const pieceWidth = toNumber(placement?.width);
    const pieceHeight = toNumber(placement?.height);

    if (pieceWidth <= 0 || pieceHeight <= 0) continue;

    const left = x;
    const right = x + pieceWidth;
    const top = y;
    const bottom = y + pieceHeight;

    if (!closeTo(left, 0)) {
      verticalEdges.push({
        position: left,
        start: top,
        end: bottom,
      });
    }

    if (!closeTo(right, width)) {
      verticalEdges.push({
        position: right,
        start: top,
        end: bottom,
      });
    }

    if (!closeTo(top, 0)) {
      horizontalEdges.push({
        position: top,
        start: left,
        end: right,
      });
    }

    if (!closeTo(bottom, height)) {
      horizontalEdges.push({
        position: bottom,
        start: left,
        end: right,
      });
    }
  }

  const verticalCuts = countGroupedEdges(verticalEdges, gapTolerance);
  const horizontalCuts = countGroupedEdges(horizontalEdges, gapTolerance);

  return {
    verticalCuts,
    horizontalCuts,
    cutCount: verticalCuts + horizontalCuts,
  };
};

const getSheetPlacements = (sheet) =>
  Array.isArray(sheet?.placements) ? sheet.placements : [];

const calculateMaterialCuts = (group, materialIndex) => {
  const material = group?.material || {};
  const optimization = group?.optimization || {};
  const inputSheet = optimization?.input?.sheet || {};

  const sheetWidth =
    toNumber(material.sheetWidth) ||
    toNumber(inputSheet.width);

  const sheetHeight =
    toNumber(material.sheetHeight) ||
    toNumber(inputSheet.height);

  const kerf =
    toNumber(material.kerf, NaN) ||
    toNumber(optimization?.metrics?.kerf, NaN) ||
    toNumber(optimization?.input?.kerf, DEFAULT_KERF);

  const code = String(
    material?.code || `MATERIAL-${materialIndex + 1}`
  ).trim();

  const sheets = Array.isArray(optimization?.sheets)
    ? optimization.sheets
    : [];

  let verticalCuts = 0;
  let horizontalCuts = 0;
  let sheetsAnalyzed = 0;

  if (sheets.length > 0) {
    for (const sheet of sheets) {
      const result = countCutsForPlacements({
        placements: getSheetPlacements(sheet),
        sheetWidth: toNumber(sheet?.width) || sheetWidth,
        sheetHeight: toNumber(sheet?.height) || sheetHeight,
        kerf,
      });

      verticalCuts += result.verticalCuts;
      horizontalCuts += result.horizontalCuts;
      sheetsAnalyzed += 1;
    }
  } else {
    const patterns = Array.isArray(optimization?.patterns)
      ? optimization.patterns
      : [];

    for (const pattern of patterns) {
      const multiplier = Math.max(
        Math.trunc(toNumber(pattern?.quantity, 1)),
        1
      );

      const result = countCutsForPlacements({
        placements: getSheetPlacements(pattern),
        sheetWidth,
        sheetHeight,
        kerf,
      });

      verticalCuts += result.verticalCuts * multiplier;
      horizontalCuts += result.horizontalCuts * multiplier;
      sheetsAnalyzed += multiplier;
    }
  }

  return {
    code,
    verticalCuts,
    horizontalCuts,
    cutCount: verticalCuts + horizontalCuts,
    sheetsAnalyzed,
  };
};

export const calculateBathroomCutService = (optimizationResponse) => {
  const data = getOptimizationData(optimizationResponse);

  if (!data || !Array.isArray(data.materials)) {
    return {
      cutCount: 0,
      verticalCuts: 0,
      horizontalCuts: 0,
      sheetsAnalyzed: 0,
      byMaterial: [],
      calculated: false,
    };
  }

  const byMaterial = data.materials.map(calculateMaterialCuts);

  return byMaterial.reduce(
    (total, material) => ({
      cutCount: total.cutCount + material.cutCount,
      verticalCuts: total.verticalCuts + material.verticalCuts,
      horizontalCuts: total.horizontalCuts + material.horizontalCuts,
      sheetsAnalyzed: total.sheetsAnalyzed + material.sheetsAnalyzed,
      byMaterial: [...total.byMaterial, material],
      calculated: true,
    }),
    {
      cutCount: 0,
      verticalCuts: 0,
      horizontalCuts: 0,
      sheetsAnalyzed: 0,
      byMaterial: [],
      calculated: true,
    }
  );
};
