export function json(statusCode, cuerpo) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  };
}

// Cuerpo de error común (api-contract § 10). `detalle` nunca lleva teléfono ni texto recibidos.
export function error(statusCode, codigo, detalle) {
  return json(statusCode, { error: { codigo, detalle } });
}
