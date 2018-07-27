export const LOCALE_STRINGS = {
    monday: false,
    weekdays: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
};

export const DIAS = [
    { id: 0, dia: 'Lunes' },
    { id: 1, dia: 'Martes' },
    { id: 2, dia: 'Miércoles' },
    { id: 3, dia: 'Jueves' },
    { id: 4, dia: 'Viernes' },
    { id: 5, dia: 'Sábado' },
    { id: 6, dia: 'Domingo' },
];

export enum EVENTOS { ACTUAL = 'actual', OTRO = 'otro' };
export enum ESTADOS_RESERVA { DISPONIBLE = 'Disponible', RESERVADO = 'Reservado', FINALIZADO = 'Finalizado', EJECUTANDO = 'Ejecutando', CANCELADO = 'Cancelado', NO_DISPONIBLE = 'No-disponible' };
export enum FILTROS_FECHA { DIARIO = 'days', SEMANAL = 'weeks', MENSUAL = 'months', ANUAL = 'years' };