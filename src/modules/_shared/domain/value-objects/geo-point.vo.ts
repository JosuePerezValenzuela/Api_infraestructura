export class GeoPoint {
  //Atributos de la clase
  private readonly lat;
  private readonly lng;

  //Constructor
  private constructor(lat: number, lng: number) {
    this.lat = lat;
    this.lng = lng;
  }

  static create(params: { lat: number; lng: number }): GeoPoint {
    const lat = params.lat;
    const lng = params.lng;

    //Ambos deben existir
    if (lat === undefined || lng === undefined) {
      throw new Error('Si se envia lat tambien se debe enviar lng y viceversa');
    }

    //Validamos que latitud sea un umero finito
    if (!Number.isFinite(lat)) {
      throw new Error('Latitud invalida');
    }

    if (!Number.isFinite(lng)) {
      throw new Error('Longitud invalida');
    }

    //Validamos que la longitud esta dentro del rango valido (-180, 180)
    if (lat < -90 || lat > 90) {
      throw new Error('Latitud fuera del rango valido');
    }

    if (lng < -180 || lng > 180) {
      throw new Error('Longitud fuera del rango valido');
    }

    return new GeoPoint(lat, lng);
  }
}
