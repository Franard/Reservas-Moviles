import * as Network from 'expo-network';

export interface EstadoConectividad {
  conectado: boolean;
  internetAlcanzable: boolean;
  tipoRed: Network.NetworkStateType | null;
}

// Hook para saber si hay conexión a internet
export function useConectividad(): EstadoConectividad {
  const estadoRed = Network.useNetworkState();

  const conectado = estadoRed.isConnected ?? true;
  const internetAlcanzable = estadoRed.isInternetReachable ?? conectado;

  return {
    conectado,
    internetAlcanzable,
    tipoRed: estadoRed.type ?? null,
  };
}

// Chequeo directo de red para servicios
export async function verificarConexionDirectaAsync(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync();
    const conectado = estado.isConnected ?? true;
    const alcanzable = estado.isInternetReachable ?? conectado;
    return conectado && alcanzable;
  } catch {
    return false;
  }
}
