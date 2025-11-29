/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  Equals,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Convierte strings como 'true'/'false' a booleanos reales, y deja undefined si no viene nada.
const transformToBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
};

// Normaliza cualquier entrada a un arreglo de numeros o undefined.
const transformToIdsArray = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map((v) => Number(v));
  if (typeof value === 'string')
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '')
      .map((v) => Number(v));
  return [Number(value)];
};

@ValidatorConstraint({ name: 'HorarioOrdenValido', async: false })
class HorarioOrdenValido implements ValidatorConstraintInterface {
  // Valida que el horario tenga las tres partes (dia, hora_inicio, hora_fin) y que el inicio sea menor al fin.
  validate(_value: unknown, args?: ValidationArguments) {
    // Obtenemos la instancia completa del DTO para leer las otras propiedades relacionadas.
    const dto = args?.object as ListAmbientesDisponiblesQueryDto | undefined;
    if (!dto) return true;
    // Si no se envio ningun campo de horario, no aplicamos esta regla.
    if (
      dto.dia === undefined &&
      dto.hora_inicio === undefined &&
      dto.hora_fin === undefined
    ) {
      return true;
    }
    // Si falta cualquiera de los tres campos requeridos, la validacion falla.
    if (
      dto.dia === undefined ||
      dto.hora_inicio === undefined ||
      dto.hora_fin === undefined
    ) {
      return false;
    }
    // Funcion auxiliar para convertir HH:mm a minutos totales.
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    // La regla final: hora_inicio debe ser menor que hora_fin.
    return toMinutes(dto.hora_inicio) < toMinutes(dto.hora_fin);
  }

  // Mensaje de error mostrado cuando la regla anterior falla.
  defaultMessage() {
    return 'hora_inicio debe ser menor que hora_fin y requiere dia, hora_inicio y hora_fin juntos';
  }
}

@ValidatorConstraint({ name: 'FacultadCampusSubconjunto', async: false })
class FacultadCampusSubconjunto implements ValidatorConstraintInterface {
  // Valida que cada facultad pertenezca al conjunto de campus enviado.
  validate(_value: unknown, args?: ValidationArguments) {
    // Obtenemos el DTO para revisar ambos arreglos.
    const dto = args?.object as ListAmbientesDisponiblesQueryDto | undefined;
    if (!dto) return true;
    // Si falta alguno de los dos arreglos, no aplicamos la regla (no hay nada que comparar).
    if (!dto.campus_ids || !dto.facultad_ids) return true;
    // Confirmamos que cada facultad este incluida en los campus.
    return dto.facultad_ids.every((id) => dto.campus_ids?.includes(id));
  }

  // Mensaje de error cuando una facultad no pertenece a los campus enviados.
  defaultMessage() {
    return 'facultad_ids debe pertenecer a campus_ids cuando ambos se envian';
  }
}

@ValidatorConstraint({ name: 'BloqueFacultadSubconjunto', async: false })
class BloqueFacultadSubconjunto implements ValidatorConstraintInterface {
  // Valida que cada bloque pertenezca al conjunto de facultades enviado.
  validate(_value: unknown, args?: ValidationArguments) {
    // Obtenemos el DTO para revisar ambos arreglos.
    const dto = args?.object as ListAmbientesDisponiblesQueryDto | undefined;
    if (!dto) return true;
    // Si falta alguno de los dos arreglos, no aplicamos la regla.
    if (!dto.facultad_ids || !dto.bloque_ids) return true;
    // Confirmamos que cada bloque este incluido en las facultades.
    return dto.bloque_ids.every((id) => dto.facultad_ids?.includes(id));
  }

  // Mensaje de error cuando un bloque no pertenece a las facultades enviadas.
  defaultMessage() {
    return 'bloque_ids debe pertenecer a facultad_ids cuando ambos se envian';
  }
}

export class ListAmbientesDisponiblesQueryDto {
  @ApiPropertyOptional({
    description: 'Capacidad minima total',
    minimum: 0,
    example: 20,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'capacidad_min debe ser un entero' })
  @Min(0, { message: 'capacidad_min debe ser mayor o igual a 0' })
  capacidad_min?: number;

  @ApiPropertyOptional({
    description: 'Capacidad minima de examen',
    minimum: 0,
    example: 15,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'capacidad_examen_min debe ser un entero' })
  @Min(0, { message: 'capacidad_examen_min debe ser mayor o igual a 0' })
  capacidad_examen_min?: number;

  @ApiPropertyOptional({
    description:
      'Debe ser true cuando se envia capacidad_examen_min para forzar mismo piso',
    example: true,
  })
  @Transform(transformToBoolean)
  @ValidateIf(
    (o: ListAmbientesDisponiblesQueryDto) =>
      o.capacidad_examen_min !== undefined,
  )
  @Equals(true, {
    message: 'mismo_piso debe ser true cuando se envia capacidad_examen_min',
  })
  mismo_piso?: boolean;

  @ApiPropertyOptional({
    description: 'IDs de campus permitidos',
    example: [1],
    type: [Number],
  })
  @Transform(transformToIdsArray)
  @IsOptional()
  @IsArray({ message: 'campus_ids debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'campus_ids no puede ser vacio' })
  @IsInt({ each: true, message: 'campus_ids debe contener enteros' })
  @Min(1, { each: true, message: 'campus_ids debe contener enteros positivos' })
  campus_ids?: number[];

  @ApiPropertyOptional({
    description: 'IDs de facultades',
    example: [1],
    type: [Number],
  })
  @Transform(transformToIdsArray)
  @IsOptional()
  @IsArray({ message: 'facultad_ids debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'facultad_ids no puede ser vacio' })
  @IsInt({ each: true, message: 'facultad_ids debe contener enteros' })
  @Min(1, {
    each: true,
    message: 'facultad_ids debe contener enteros positivos',
  })
  @Validate(FacultadCampusSubconjunto)
  facultad_ids?: number[];

  @ApiPropertyOptional({
    description: 'IDs de bloques',
    example: [1],
    type: [Number],
  })
  @Transform(transformToIdsArray)
  @IsOptional()
  @IsArray({ message: 'bloque_ids debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'bloque_ids no puede ser vacio' })
  @IsInt({ each: true, message: 'bloque_ids debe contener enteros' })
  @Min(1, { each: true, message: 'bloque_ids debe contener enteros positivos' })
  @Validate(BloqueFacultadSubconjunto)
  bloque_ids?: number[];

  @ApiPropertyOptional({
    description: 'IDs de tipos de bloque',
    example: [1],
    type: [Number],
  })
  @Transform(transformToIdsArray)
  @IsOptional()
  @IsArray({ message: 'tipo_bloque_ids debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'tipo_bloque_ids no puede ser vacio' })
  @IsInt({ each: true, message: 'tipo_bloque_ids debe contener enteros' })
  @Min(1, {
    each: true,
    message: 'tipo_bloque_ids debe contener enteros positivos',
  })
  tipo_bloque_ids?: number[];

  @ApiPropertyOptional({
    description: 'IDs de tipos de ambiente',
    example: [1],
    type: [Number],
  })
  @Transform(transformToIdsArray)
  @IsOptional()
  @IsArray({ message: 'tipo_ambiente_ids debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'tipo_ambiente_ids no puede ser vacio' })
  @IsInt({ each: true, message: 'tipo_ambiente_ids debe contener enteros' })
  @Min(1, {
    each: true,
    message: 'tipo_ambiente_ids debe contener enteros positivos',
  })
  tipo_ambiente_ids?: number[];

  @ApiPropertyOptional({
    description: 'Dia de la semana (0=domingo, 6=sabado)',
    minimum: 0,
    maximum: 6,
    example: 0,
  })
  @Type(() => Number)
  @ValidateIf(
    (o: ListAmbientesDisponiblesQueryDto) =>
      o.dia !== undefined ||
      o.hora_inicio !== undefined ||
      o.hora_fin !== undefined,
  )
  @IsInt({ message: 'dia debe ser un entero' })
  @Min(0, { message: 'dia debe ser mayor o igual a 0' })
  @Max(6, { message: 'dia debe ser menor o igual a 6' })
  dia?: number;

  @ApiPropertyOptional({
    description: 'Hora de inicio en formato HH:mm',
    example: '08:00',
  })
  @ValidateIf(
    (o: ListAmbientesDisponiblesQueryDto) =>
      o.dia !== undefined ||
      o.hora_inicio !== undefined ||
      o.hora_fin !== undefined,
  )
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_inicio debe tener formato HH:mm',
  })
  hora_inicio?: string;

  @ApiPropertyOptional({
    description: 'Hora de fin en formato HH:mm',
    example: '10:00',
  })
  @ValidateIf(
    (o: ListAmbientesDisponiblesQueryDto) =>
      o.dia !== undefined ||
      o.hora_inicio !== undefined ||
      o.hora_fin !== undefined,
  )
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_fin debe tener formato HH:mm',
  })
  @Validate(HorarioOrdenValido)
  hora_fin?: string;

  @ApiPropertyOptional({
    description: 'Pagina (base 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por pagina',
    minimum: 1,
    maximum: 50,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'take debe ser un entero' })
  @Min(1, { message: 'take debe ser mayor o igual a 1' })
  @Max(50, { message: 'take no puede superar 50' })
  take?: number;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    enum: ['nombre', 'codigo', 'piso'],
    default: 'nombre',
  })
  @IsOptional()
  @IsIn(['nombre', 'codigo', 'piso'], {
    message: 'orderBy solo puede ser nombre, codigo o piso',
  })
  orderBy?: 'nombre' | 'codigo' | 'piso';

  @ApiPropertyOptional({
    description: 'Direccion de orden',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'orderDir solo puede ser asc o desc' })
  orderDir?: 'asc' | 'desc';
}
