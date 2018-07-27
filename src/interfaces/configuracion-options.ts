
export interface ConfiguracionOptions{
    horaInicio: number,
    horaFin: number,
    tiempoDisponibilidad: number,
    tiempoAlerta: number,
    horaNoDisponibleInicio: number,
    horaNoDisponibleFin: number,
    diasNoDisponible: string[],
    control_usuarios: boolean
}