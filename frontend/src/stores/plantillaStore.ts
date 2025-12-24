import { create } from 'zustand';

export interface Pregunta {
  id: string;
  texto: string;
  tipo: 'UNA_OPCION' | 'MULTIPLES_OPCIONES' | 'TEXTO' | 'NUMERO' | 'FOTO_URL' | 'FECHA';
  opciones?: Array<{ value: string; label: string }>;
  validaciones?: {
    requerido?: boolean;
    min?: number;
    max?: number;
    patron?: string;
  };
  esInicial?: boolean;
}

export interface Transicion {
  id: string;
  desdePreguntaId: string;
  operador: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'GT' | 'LT' | 'GTE' | 'LTE' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
  valor?: string | number | string[];
  siguientesPreguntas: string[];
  prioridad: number;
  esDefault?: boolean;
}

export interface CondicionResultado {
  preguntaId: string;
  operador: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'GT' | 'LT' | 'GTE' | 'LTE' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
  valor?: string | number | string[];
}

export interface AccionResultado {
  tipo: 'ESCALATE' | 'ORDER_PART' | 'SCHEDULE_FOLLOWUP' | 'NOTIFY' | 'LOG';
  payload: any;
}

export interface Resultado {
  id: string;
  nombre: string;
  prioridad: number;
  condiciones: CondicionResultado[];
  acciones: AccionResultado[];
}

export interface ConfiguracionPlantilla {
  datosBasicos: {
    nombre: string;
    descripcion?: string;
    duracionEstimada: number;
    allowBacktrack: boolean;
    maxDepth: number;
    exigirRespuestas: boolean;
  };
  preguntas: Pregunta[];
  transiciones: Transicion[];
  resultados: Resultado[];
}

interface PlantillaStore {
  configuracion: ConfiguracionPlantilla | null;
  setConfiguracion: (config: ConfiguracionPlantilla) => void;
  actualizarDatosBasicos: (datos: Partial<ConfiguracionPlantilla['datosBasicos']>) => void;
  agregarPregunta: (pregunta: Pregunta) => void;
  actualizarPregunta: (id: string, pregunta: Partial<Pregunta>) => void;
  eliminarPregunta: (id: string) => void;
  agregarTransicion: (transicion: Transicion) => void;
  actualizarTransicion: (id: string, transicion: Partial<Transicion>) => void;
  eliminarTransicion: (id: string) => void;
  agregarResultado: (resultado: Resultado) => void;
  actualizarResultado: (id: string, resultado: Partial<Resultado>) => void;
  eliminarResultado: (id: string) => void;
  reset: () => void;
}

const configuracionInicial: ConfiguracionPlantilla = {
  datosBasicos: {
    nombre: '',
    descripcion: '',
    duracionEstimada: 10,
    allowBacktrack: true,
    maxDepth: 10,
    exigirRespuestas: true,
  },
  preguntas: [],
  transiciones: [],
  resultados: [],
};

export const usePlantillaStore = create<PlantillaStore>((set) => ({
  configuracion: null,
  
  setConfiguracion: (config) => set({ configuracion: config }),
  
  actualizarDatosBasicos: (datos) =>
    set((state) => ({
      configuracion: state.configuracion
        ? {
            ...state.configuracion,
            datosBasicos: { ...state.configuracion.datosBasicos, ...datos },
          }
        : { ...configuracionInicial, datosBasicos: { ...configuracionInicial.datosBasicos, ...datos } },
    })),
  
  agregarPregunta: (pregunta) =>
    set((state) => ({
      configuracion: state.configuracion
        ? {
            ...state.configuracion,
            preguntas: [...state.configuracion.preguntas, pregunta],
          }
        : { ...configuracionInicial, preguntas: [pregunta] },
    })),
  
  actualizarPregunta: (id, pregunta) =>
    set((state) => {
      if (!state.configuracion) return state;
      return {
        configuracion: {
          ...state.configuracion,
          preguntas: state.configuracion.preguntas.map((p) =>
            p.id === id ? { ...p, ...pregunta } : p,
          ),
        },
      };
    }),
  
  eliminarPregunta: (id) =>
    set((state) => {
      if (!state.configuracion) return state;
      return {
        configuracion: {
          ...state.configuracion,
          preguntas: state.configuracion.preguntas.filter((p) => p.id !== id),
          transiciones: state.configuracion.transiciones.filter(
            (t) => t.desdePreguntaId !== id && !t.siguientesPreguntas.includes(id),
          ),
          resultados: state.configuracion.resultados.map((r) => ({
            ...r,
            condiciones: r.condiciones.filter((c) => c.preguntaId !== id),
          })),
        },
      };
    }),
  
  agregarTransicion: (transicion) =>
    set((state) => ({
      configuracion: state.configuracion
        ? {
            ...state.configuracion,
            transiciones: [...state.configuracion.transiciones, transicion],
          }
        : { ...configuracionInicial, transiciones: [transicion] },
    })),
  
  actualizarTransicion: (id, transicion) =>
    set((state) => {
      if (!state.configuracion) return state;
      return {
        configuracion: {
          ...state.configuracion,
          transiciones: state.configuracion.transiciones.map((t) =>
            t.id === id ? { ...t, ...transicion } : t,
          ),
        },
      };
    }),
  
  eliminarTransicion: (id) =>
    set((state) => {
      if (!state.configuracion) return state;
      return {
        configuracion: {
          ...state.configuracion,
          transiciones: state.configuracion.transiciones.filter((t) => t.id !== id),
        },
      };
    }),
  
  agregarResultado: (resultado) =>
    set((state) => ({
      configuracion: state.configuracion
        ? {
            ...state.configuracion,
            resultados: [...state.configuracion.resultados, resultado],
          }
        : { ...configuracionInicial, resultados: [resultado] },
    })),
  
  actualizarResultado: (id, resultado) =>
    set((state) => {
      if (!state.configuracion) return state;
      return {
        configuracion: {
          ...state.configuracion,
          resultados: state.configuracion.resultados.map((r) =>
            r.id === id ? { ...r, ...resultado } : r,
          ),
        },
      };
    }),
  
  eliminarResultado: (id) =>
    set((state) => {
      if (!state.configuracion) return state;
      return {
        configuracion: {
          ...state.configuracion,
          resultados: state.configuracion.resultados.filter((r) => r.id !== id),
        },
      };
    }),
  
  reset: () => set({ configuracion: null }),
}));

