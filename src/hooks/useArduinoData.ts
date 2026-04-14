import { useState, useEffect, useCallback, useRef } from 'react';
import { ArduinoData, ArduinoConnectionState } from '../types';
import { fetchArduinoData, DEFAULT_ARDUINO_PORT } from '../services/arduinoService';

export interface ArduinoState {
  data: ArduinoData | null;
  status: ArduinoConnectionState;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useArduinoData(
  ip: string,
  port: number = DEFAULT_ARDUINO_PORT,
  intervalMs: number = 5000,
): ArduinoState {
  const [data, setData] = useState<ArduinoData | null>(null);
  const [status, setStatus] = useState<ArduinoConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use a ref to avoid stale closure in the interval
  const ipRef = useRef(ip);
  const portRef = useRef(port);
  useEffect(() => { ipRef.current = ip; }, [ip]);
  useEffect(() => { portRef.current = port; }, [port]);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await fetchArduinoData(ipRef.current, portRef.current);
      setData(result);
      setError(null);
      setStatus('connected');
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs, ip, port]);

  return { data, status, error, lastUpdated, refresh };
}
