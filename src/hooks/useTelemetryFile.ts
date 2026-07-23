import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildFleet, normalizeDataset } from '../lib/telemetry';
import type { FleetUnit, TelemetryRecord } from '../types/telemetry';

interface TelemetryFileState {
  records: TelemetryRecord[];
  fleet: FleetUnit[];
  fileName: string;
  loading: boolean;
  error: string | null;
  loadFile: (file: File) => Promise<void>;
  resetSample: () => Promise<void>;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

export function useTelemetryFile(): TelemetryFileState {
  const [records, setRecords] = useState<TelemetryRecord[]>([]);
  const [fileName, setFileName] = useState('sample-rivertech.json');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUnknown = useCallback((input: unknown, nextFileName: string) => {
    const normalized = normalizeDataset(input);
    if (normalized.length === 0) {
      throw new Error('El archivo no contiene posiciones válidas con deviceid, latitude y longitude.');
    }
    setRecords(normalized);
    setFileName(nextFileName);
    setError(null);
  }, []);

  const resetSample = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/sample-rivertech.json');
      const payload = await readJsonResponse(response);
      loadUnknown(payload, 'sample-rivertech.json');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'No fue posible cargar la muestra.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadUnknown]);

  useEffect(() => {
    void resetSample();
  }, [resetSample]);

  const loadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        if (!file.name.toLowerCase().endsWith('.json')) {
          throw new Error('Solo se admiten archivos .json.');
        }
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('El archivo supera el límite de 50 MB.');
        }
        const text = await file.text();
        const payload: unknown = JSON.parse(text);
        loadUnknown(payload, file.name);
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : 'No fue posible procesar el archivo.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [loadUnknown],
  );

  const fleet = useMemo(() => buildFleet(records), [records]);

  return { records, fleet, fileName, loading, error, loadFile, resetSample };
}
