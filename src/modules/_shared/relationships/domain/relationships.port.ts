export const RelationshipsPort = Symbol('RelationshipsPort');

export interface RelationshipsPort {
  //Marca como inactivo todas las entidades descendientes de un campus
  markCampusCascadeInactive(campusId: number): Promise<void>;

  markFacultadCascadeInactive(facultadId: number): Promise<void>;

  markBloquesCascadeInactive(bloqueId: number): Promise<void>;

  deleteCampusCascade(campusId: number): Promise<void>;

  deleteFacultadCascade(facultadId: number): Promise<void>;

  deleteTipoBloqueCascade(tipoBloqueId: number): Promise<void>;
}
