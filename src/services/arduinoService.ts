import { ArduinoData } from '../types';

export const DEFAULT_ARDUINO_IP = '10.19.128.179';
export const DEFAULT_ARDUINO_PORT = 80;
export const ARDUINO_TIMEOUT_MS = 5000;

export async function fetchArduinoData(
  ip: string,
  port: number = DEFAULT_ARDUINO_PORT,
): Promise<ArduinoData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ARDUINO_TIMEOUT_MS);

  try {
    const response = await fetch(`http://${ip}:${port}/data`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    return json as ArduinoData;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout (${ARDUINO_TIMEOUT_MS / 1000}s) — Arduino injoignable`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
