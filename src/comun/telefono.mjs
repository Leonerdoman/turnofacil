const PATRON = /^\+573\d{9}$/;

export function esTelefono(valor) {
  return typeof valor === 'string' && PATRON.test(valor);
}
