export interface InfoErrorUI {
  mensaje: string;
  codigo?: string;
}

// Saca el mensaje y código de error para mostrar en la pantalla
export function extraerInfoErrorUI(
  error: unknown,
  mensajePorDefecto = 'No se pudo completar la consulta. Verificá tu conexión.'
): InfoErrorUI {
  if (typeof error === 'object' && error !== null) {
    const mensaje =
      'message' in error && typeof error.message === 'string' && error.message.length > 0
        ? error.message
        : mensajePorDefecto;

    const codigo =
      'codigo' in error && typeof error.codigo === 'string' && error.codigo.length > 0
        ? error.codigo
        : undefined;

    return { mensaje, codigo };
  }

  return { mensaje: mensajePorDefecto };
}
