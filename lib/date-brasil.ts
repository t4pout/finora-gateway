// Utilitário central - sempre usa horário de Brasília (America/Sao_Paulo)

export const TZ = 'America/Sao_Paulo';

/** Retorna um Date representando agora no horário de Brasília */
export function agoraBrasil(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

/** Converte qualquer data UTC do banco para horário de Brasília */
export function toBrasil(date: Date | string): Date {
  return new Date(new Date(date).toLocaleString('en-US', { timeZone: TZ }));
}

/** Formata data no padrão brasileiro dd/mm/aaaa */
export function formatarData(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: TZ });
}

/** Formata hora no padrão brasileiro hh:mm:ss */
export function formatarHora(date: Date | string): string {
  return new Date(date).toLocaleTimeString('pt-BR', { timeZone: TZ });
}

/** Formata data e hora completa */
export function formatarDataHora(date: Date | string): string {
  return new Date(date).toLocaleString('pt-BR', { timeZone: TZ });
}

/** Retorna início do dia (00:00:00) em Brasília como Date UTC */
export function inicioDiaBrasil(date?: Date): Date {
  const base = date || agoraBrasil();
  const d = toBrasil(base);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Retorna fim do dia (23:59:59) em Brasília como Date UTC */
export function fimDiaBrasil(date?: Date): Date {
  const base = date || agoraBrasil();
  const d = toBrasil(base);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Retorna início de N dias atrás em Brasília */
export function inicioDiasAtras(dias: number): Date {
  const d = agoraBrasil();
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Compara se uma data (string UTC do banco) é igual ao dia de ontem em Brasília */
export function isOntem(dateStr: string): boolean {
  const hoje = agoraBrasil();
  hoje.setHours(0, 0, 0, 0);
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const dataVenda = toBrasil(dateStr);
  dataVenda.setHours(0, 0, 0, 0);

  return dataVenda.getTime() === ontem.getTime();
}

/** Normaliza uma string 'YYYY-MM-DD' para Date no início do dia em Brasília */
export function parseDateInput(str: string): Date {
  const [a, m, d] = str.split('-').map(Number);
  const date = agoraBrasil();
  date.setFullYear(a, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}