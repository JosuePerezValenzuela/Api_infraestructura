export const RelationshipsPort = Symbol('RelationshipsPort');

export interface RelationshipsPort {
  //Marca como inactivo todas las entidades descendientes de un campus
  markCampusCascadeIncative(campusId: number): Promise<void>;

  markFacultadCascadeInactive(facultadId: number): Promise<void>;

  markBloquesCascadeInactive(bloqueId: number): Promise<void>;
}
