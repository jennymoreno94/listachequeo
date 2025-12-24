import { useEffect, useState } from 'react';
import { usePlantillaStore } from '../../stores/plantillaStore';
import { plantillasApi } from '../../services/api';
import PestañaDatosBasicos from './PestañaDatosBasicos';
import PestañaPreguntas from './PestañaPreguntas';
import PestañaTransiciones from './PestañaTransiciones';
import PestañaResultados from './PestañaResultados';
import PestañaValidar from './PestañaValidar';
import './ConstructorPlantilla.css';

interface ConstructorPlantillaProps {
  plantillaId?: string | null;
  onVolver: () => void;
}

export default function ConstructorPlantilla({ plantillaId, onVolver }: ConstructorPlantillaProps) {
  const { configuracion, setConfiguracion, reset } = usePlantillaStore();
  const [pestañaActiva, setPestañaActiva] = useState(0);
  const [cargando, setCargando] = useState(!!plantillaId);
  const [plantillaNombre, setPlantillaNombre] = useState('');

  useEffect(() => {
    if (plantillaId) {
      cargarPlantilla();
    } else {
      // Nueva plantilla - inicializar con valores por defecto
      reset();
      const configInicial = {
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
      setConfiguracion(configInicial);
    }
  }, [plantillaId, reset, setConfiguracion]);

  const cargarPlantilla = async () => {
    try {
      setCargando(true);
      const plantilla = await plantillasApi.obtener(plantillaId!);
      setPlantillaNombre(plantilla.data.nombre);
      
      let config: any = null;
      
      // Cargar borrador si existe, sino usar última versión
      if (plantilla.data.borradores && plantilla.data.borradores.length > 0) {
        config = plantilla.data.borradores[0].configuracion;
      } else if (plantilla.data.versiones && plantilla.data.versiones.length > 0) {
        config = plantilla.data.versiones[0].configuracion;
      }
      
      // Si hay configuración, asegurarnos de que tenga nombre y descripción desde la plantilla
      if (config) {
        // Sincronizar nombre y descripción desde la plantilla principal
        if (!config.datosBasicos) {
          config.datosBasicos = {};
        }
        // Usar el nombre y descripción de la plantilla si no están en datosBasicos
        config.datosBasicos.nombre = config.datosBasicos.nombre || plantilla.data.nombre;
        config.datosBasicos.descripcion = config.datosBasicos.descripcion || plantilla.data.descripcion || '';
        
        setConfiguracion(config);
      } else {
        // Si no hay configuración, crear una nueva con los datos de la plantilla
        const configInicial = {
          datosBasicos: {
            nombre: plantilla.data.nombre,
            descripcion: plantilla.data.descripcion || '',
            duracionEstimada: 10,
            allowBacktrack: true,
            maxDepth: 10,
            exigirRespuestas: true,
          },
          preguntas: [],
          transiciones: [],
          resultados: [],
        };
        setConfiguracion(configInicial);
      }
    } catch (error) {
      console.error('Error al cargar plantilla:', error);
      alert('Error al cargar plantilla');
    } finally {
      setCargando(false);
    }
  };

  const pestañas = [
    { id: 0, nombre: 'Datos Básicos', componente: PestañaDatosBasicos },
    { id: 1, nombre: 'Preguntas', componente: PestañaPreguntas },
    { id: 2, nombre: 'Transiciones', componente: PestañaTransiciones },
    { id: 3, nombre: 'Resultados', componente: PestañaResultados },
    { id: 4, nombre: 'Validar y Publicar', componente: PestañaValidar },
  ];

  const descargarJSON = () => {
    if (!configuracion) {
      alert('No hay configuración para descargar. Por favor, completa al menos los datos básicos.');
      return;
    }

    // Calcular estadísticas
    const preguntasIniciales = configuracion.preguntas.filter(p => p.esInicial).length;
    const transicionesDefault = configuracion.transiciones.filter(t => t.esDefault).length;
    const tiposPreguntas = configuracion.preguntas.reduce((acc: { [key: string]: number }, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1;
      return acc;
    }, {});

    // Crear objeto completo con metadatos
    const jsonCompleto = {
      metadata: {
        version: '1.0',
        fechaGeneracion: new Date().toISOString(),
        nombrePlantilla: configuracion.datosBasicos.nombre || 'Plantilla sin nombre',
        descripcion: configuracion.datosBasicos.descripcion || '',
        estadisticas: {
          totalPreguntas: configuracion.preguntas.length,
          preguntasIniciales: preguntasIniciales,
          totalTransiciones: configuracion.transiciones.length,
          transicionesDefault: transicionesDefault,
          totalResultados: configuracion.resultados.length,
          tiposPreguntas: tiposPreguntas,
        },
        resumenPasos: {
          paso1_datosBasicos: {
            completado: !!configuracion.datosBasicos.nombre,
            nombre: configuracion.datosBasicos.nombre || 'No definido',
            descripcion: configuracion.datosBasicos.descripcion || 'Sin descripción',
            duracionEstimada: `${configuracion.datosBasicos.duracionEstimada} minutos`,
            permitirRetroceso: configuracion.datosBasicos.allowBacktrack ? 'Sí' : 'No',
            profundidadMaxima: configuracion.datosBasicos.maxDepth,
            exigirRespuestas: configuracion.datosBasicos.exigirRespuestas ? 'Sí' : 'No',
          },
          paso2_preguntas: {
            completado: configuracion.preguntas.length > 0,
            totalPreguntas: configuracion.preguntas.length,
            preguntas: configuracion.preguntas.map(p => ({
              id: p.id,
              texto: p.texto,
              tipo: p.tipo,
              esInicial: p.esInicial || false,
              tieneOpciones: !!(p.opciones && p.opciones.length > 0),
              cantidadOpciones: p.opciones?.length || 0,
              requerida: p.validaciones?.requerido || false,
            })),
          },
          paso3_transiciones: {
            completado: configuracion.transiciones.length > 0,
            totalTransiciones: configuracion.transiciones.length,
            transiciones: configuracion.transiciones.map(t => ({
              id: t.id,
              desdePregunta: t.desdePreguntaId,
              operador: t.operador,
              valor: t.valor,
              siguientesPreguntas: t.siguientesPreguntas,
              prioridad: t.prioridad,
              esDefault: t.esDefault || false,
            })),
          },
          paso4_resultados: {
            completado: configuracion.resultados.length > 0,
            totalResultados: configuracion.resultados.length,
            resultados: configuracion.resultados.map(r => ({
              id: r.id,
              nombre: r.nombre,
              prioridad: r.prioridad,
              cantidadCondiciones: r.condiciones.length,
              cantidadAcciones: r.acciones.length,
              acciones: r.acciones.map(a => a.tipo),
            })),
          },
        },
      },
      configuracion: configuracion,
    };

    // Convertir a JSON con formato legible
    const jsonString = JSON.stringify(jsonCompleto, null, 2);

    // Crear blob y descargar
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Nombre del archivo basado en el nombre de la plantilla
    const nombreArchivo = (configuracion.datosBasicos.nombre || 'plantilla')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const fecha = new Date().toISOString().split('T')[0];
    link.download = `plantilla-${nombreArchivo}-${fecha}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (cargando) {
    return <div className="constructor-plantilla">Cargando...</div>;
  }

  const ComponenteActivo = pestañas[pestañaActiva].componente;

  return (
    <div className="constructor-plantilla">
      <div className="constructor-header">
        <h2>
          {plantillaId ? `Editar: ${plantillaNombre}` : 'Nueva Plantilla'}
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={descargarJSON}
            className="btn-descargar"
            style={{
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
            }}
            title="Descargar JSON completo de la configuración"
          >
            <span>⬇️</span>
            <span>Descargar JSON</span>
          </button>
          <button onClick={onVolver} className="btn-volver">
            ← Volver
          </button>
        </div>
      </div>

      <div className="pestañas">
        {pestañas.map((pestaña) => (
          <button
            key={pestaña.id}
            onClick={() => setPestañaActiva(pestaña.id)}
            className={`pestaña ${pestañaActiva === pestaña.id ? 'activa' : ''}`}
          >
            {pestaña.nombre}
          </button>
        ))}
      </div>

      <div className="pestaña-contenido">
        <ComponenteActivo plantillaId={plantillaId} />
      </div>
    </div>
  );
}

