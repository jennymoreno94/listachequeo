import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PlantillaBorrador {
  id: string;
  plantillaId: string;
  configuracion: any;
  actualizadaEn: string;
}

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  borradores?: PlantillaBorrador[];
  versiones?: PlantillaVersion[];
}

export interface PlantillaVersion {
  id: string;
  plantillaId: string;
  version: number;
  configuracion: any;
  checksum: string;
  publicadaEn: string;
}

export interface Ejecucion {
  id: string;
  plantillaId: string;
  plantillaVersionId: string;
  estado: string;
  iniciadaEn: string;
  finalizadaEn?: string;
  plantilla?: Plantilla;
  plantillaVersion?: PlantillaVersion;
  caminoVisible?: any[];
  respuestas?: any[];
}

// Plantillas
export const plantillasApi = {
  crear: (data: { nombre: string; descripcion?: string }) =>
    api.post<Plantilla>('/plantillas', data),
  
  listar: () =>
    api.get<Plantilla[]>('/plantillas'),
  
  obtener: (id: string) =>
    api.get<Plantilla>(`/plantillas/${id}`),
  
  guardarBorrador: (id: string, configuracion: any) =>
    api.put(`/plantillas/${id}/borrador`, { configuracion }),
  
  validar: (id: string, configuracion: any) =>
    api.post(`/plantillas/${id}/validar`, { configuracion }),
  
  publicar: (id: string, configuracion: any) =>
    api.post<PlantillaVersion>(`/plantillas/${id}/publicar`, { configuracion }),
  
  obtenerVersiones: (id: string) =>
    api.get<PlantillaVersion[]>(`/plantillas/${id}/versiones`),
  
  obtenerVersion: (versionId: string) =>
    api.get<PlantillaVersion>(`/plantillas/version/${versionId}`),
};

// Ejecuciones
export const ejecucionesApi = {
  crear: (data: { plantillaId: string; plantillaVersionId: string }) =>
    api.post<Ejecucion>('/ejecuciones', data),
  
  obtener: (id: string) =>
    api.get<Ejecucion>(`/ejecuciones/${id}`),
  
  aplicarRespuesta: (id: string, preguntaId: string, valor: any) =>
    api.post(`/ejecuciones/${id}/respuestas`, { preguntaId, valor }),
  
  deshacer: (id: string) =>
    api.post(`/ejecuciones/${id}/deshacer`),
  
  finalizar: (id: string) =>
    api.post(`/ejecuciones/${id}/finalizar`),
};

export default api;

