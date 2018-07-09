export const LOCALE_STRINGS = {
    monday: false,
    weekdays: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
};

export enum EVENTOS { ACTUAL = 'actual', OTRO = 'otro' };

export enum ESTADOS_RESERVA { DISPONIBLE = 'Disponible', RESERVADO = 'Reservado', FINALIZADO = 'Finalizado', EJECUTANDO = 'Ejecutando', CANCELADO = 'Cancelado' };
export enum FILTROS_FECHA { DIARIO = 'days', SEMANAL = 'weeks', MENSUAL = 'months', ANUAL = 'years' };