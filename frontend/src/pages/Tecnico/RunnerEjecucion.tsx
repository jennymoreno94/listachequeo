import { useState, useEffect } from 'react';
import { plantillasApi, ejecucionesApi, Plantilla, Ejecucion } from '../../services/api';
import './RunnerEjecucion.css';

export default function RunnerEjecucion() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<string | null>(null);
  const [versionSeleccionada, setVersionSeleccionada] = useState<string | null>(null);
  const [ejecucion, setEjecucion] = useState<Ejecucion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [preguntaActual, setPreguntaActual] = useState<any>(null);
  const [respuestaActual, setRespuestaActual] = useState<any>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [respuestasInvalidadas, setRespuestasInvalidadas] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    cargarPlantillas();
  }, []);

  useEffect(() => {
    if (ejecucion) {
      cargarEjecucion();
    }
  }, [ejecucion?.id]);

  const cargarPlantillas = async () => {
    try {
      const response = await plantillasApi.listar();
      const publicadas = response.data.filter(p => 
        p.estado === 'PUBLICADA' && p.versiones && p.versiones.length > 0
      );
      setPlantillas(publicadas);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      alert('Error al cargar plantillas');
    }
  };

  const iniciarEjecucion = async () => {
    if (!plantillaSeleccionada || !versionSeleccionada) {
      alert('Selecciona una plantilla y versión');
      return;
    }

    try {
      setCargando(true);
      const response = await ejecucionesApi.crear({
        plantillaId: plantillaSeleccionada,
        plantillaVersionId: versionSeleccionada,
      });
      setEjecucion(response.data);
      setHistorial([{ tipo: 'inicio', timestamp: new Date() }]);
    } catch (error) {
      console.error('Error al iniciar ejecución:', error);
      alert('Error al iniciar ejecución');
    } finally {
      setCargando(false);
    }
  };

  const cargarEjecucion = async () => {
    if (!ejecucion) return;

    try {
      const response = await ejecucionesApi.obtener(ejecucion.id);
      const ejec = response.data;
      setEjecucion(ejec);

      // Obtener siguiente pregunta no respondida
      const config = ejec.plantillaVersion?.configuracion;
      const caminoVisible = ejec.caminoVisible || [];
      const respuestas = ejec.respuestas || [];

      const preguntasRespondidas = new Set(respuestas.map((r: any) => r.preguntaId));
      const siguientePregunta = caminoVisible.find(
        (p: any) => !preguntasRespondidas.has(p.preguntaId)
      );

      setPreguntaActual(siguientePregunta || null);
    } catch (error) {
      console.error('Error al cargar ejecución:', error);
    }
  };

  const aplicarRespuesta = async () => {
    if (!ejecucion || !preguntaActual || !respuestaActual) {
      alert('Completa la respuesta');
      return;
    }

    try {
      setCargando(true);
      const response = await ejecucionesApi.aplicarRespuesta(
        ejecucion.id,
        preguntaActual.preguntaId,
        respuestaActual
      );

      const invalidadas = response.data.respuestasInvalidadas || [];
      
      if (invalidadas.length >= 3) {
        setRespuestasInvalidadas(invalidadas);
        setMostrarConfirmacion(true);
      } else if (invalidadas.length > 0) {
        alert(`Se invalidaron ${invalidadas.length} respuesta(s) anterior(es)`);
      }

      setHistorial([...historial, {
        tipo: 'respuesta',
        preguntaId: preguntaActual.preguntaId,
        valor: respuestaActual,
        timestamp: new Date(),
      }]);

      await cargarEjecucion();
      setRespuestaActual(null);
    } catch (error) {
      console.error('Error al aplicar respuesta:', error);
      alert('Error al guardar respuesta');
    } finally {
      setCargando(false);
    }
  };

  const deshacer = async () => {
    if (!ejecucion) return;

    try {
      await ejecucionesApi.deshacer(ejecucion.id);
      setHistorial([...historial, { tipo: 'deshacer', timestamp: new Date() }]);
      await cargarEjecucion();
      alert('Cambio deshecho');
    } catch (error: any) {
      alert(error.response?.data?.message || 'No hay cambios recientes para deshacer');
    }
  };

  const finalizar = async () => {
    if (!ejecucion) return;

    if (!confirm('¿Estás seguro de finalizar esta ejecución?')) {
      return;
    }

    try {
      setCargando(true);
      const response = await ejecucionesApi.finalizar(ejecucion.id);
      setResultados(response.data.resultados || []);
      await cargarEjecucion();
    } catch (error: any) {
      console.error('Error al finalizar:', error);
      if (error.response?.data?.errores) {
        alert(`Error: ${error.response.data.errores.join(', ')}`);
      } else {
        alert('Error al finalizar ejecución');
      }
    } finally {
      setCargando(false);
    }
  };

  const renderizarInputPregunta = () => {
    if (!preguntaActual) return null;

    switch (preguntaActual.tipo) {
      case 'UNA_OPCION':
        return (
          <div className="opciones-radio">
            {preguntaActual.opciones?.map((op: any, idx: number) => (
              <label key={idx} className="opcion-radio">
                <input
                  type="radio"
                  name="respuesta"
                  value={op.value}
                  checked={respuestaActual === op.value}
                  onChange={(e) => setRespuestaActual(e.target.value)}
                />
                {op.label}
              </label>
            ))}
          </div>
        );

      case 'MULTIPLES_OPCIONES':
        const valores = Array.isArray(respuestaActual) ? respuestaActual : [];
        return (
          <div className="opciones-checkbox">
            {preguntaActual.opciones?.map((op: any, idx: number) => (
              <label key={idx} className="opcion-checkbox">
                <input
                  type="checkbox"
                  checked={valores.includes(op.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRespuestaActual([...valores, op.value]);
                    } else {
                      setRespuestaActual(valores.filter((v: string) => v !== op.value));
                    }
                  }}
                />
                {op.label}
              </label>
            ))}
          </div>
        );

      case 'TEXTO':
        return (
          <input
            type="text"
            value={respuestaActual || ''}
            onChange={(e) => setRespuestaActual(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="input-texto"
          />
        );

      case 'NUMERO':
        return (
          <input
            type="number"
            value={respuestaActual || ''}
            onChange={(e) => setRespuestaActual(Number(e.target.value))}
            placeholder="Ingresa un número..."
            className="input-numero"
          />
        );

      case 'FOTO_URL':
        return (
          <input
            type="url"
            value={respuestaActual || ''}
            onChange={(e) => setRespuestaActual(e.target.value)}
            placeholder="https://ejemplo.com/foto.jpg"
            className="input-url"
          />
        );

      case 'FECHA':
        return (
          <input
            type="date"
            value={respuestaActual || ''}
            onChange={(e) => setRespuestaActual(e.target.value)}
            className="input-fecha"
          />
        );

      default:
        return <p>Tipo de pregunta no soportado</p>;
    }
  };

  if (ejecucion?.estado === 'FINALIZADA') {
    return (
      <div className="runner-ejecucion">
        <h2>Ejecución Finalizada</h2>
        <div className="resultados-finales">
          <h3>Resultados Aplicables:</h3>
          {resultados.length === 0 ? (
            <p>No se aplicaron resultados.</p>
          ) : (
            resultados.map((resultado, idx) => (
              <div key={idx} className="resultado-card">
                <h4>{resultado.nombre}</h4>
                <div className="acciones-resultado">
                  {resultado.acciones?.map((accion: any, aidx: number) => (
                    <div key={aidx} className="accion">
                      <strong>{accion.tipo}:</strong> {JSON.stringify(accion.payload)}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!ejecucion) {
    const plantilla = plantillas.find(p => p.id === plantillaSeleccionada);
    const versiones = plantilla?.versiones || [];

    return (
      <div className="runner-ejecucion">
        <h2>Iniciar Ejecución de Checklist</h2>
        <div className="seleccion-plantilla">
          <div className="form-group">
            <label>Seleccionar Plantilla *</label>
            <select
              value={plantillaSeleccionada || ''}
              onChange={(e) => {
                setPlantillaSeleccionada(e.target.value);
                setVersionSeleccionada(null);
              }}
            >
              <option value="">Seleccionar...</option>
              {plantillas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {plantillaSeleccionada && versiones.length > 0 && (
            <div className="form-group">
              <label>Seleccionar Versión *</label>
              <select
                value={versionSeleccionada || ''}
                onChange={(e) => setVersionSeleccionada(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {versiones.map(v => (
                  <option key={v.id} value={v.id}>
                    Versión {v.version}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={iniciarEjecucion}
            disabled={!plantillaSeleccionada || !versionSeleccionada || cargando}
            className="btn-iniciar"
          >
            {cargando ? 'Iniciando...' : 'Iniciar Ejecución'}
          </button>
        </div>
      </div>
    );
  }

  const config = ejecucion.plantillaVersion?.configuracion;
  const allowBacktrack = config?.datosBasicos?.allowBacktrack;

  return (
    <div className="runner-ejecucion">
      <div className="runner-header">
        <h2>{ejecucion.plantilla?.nombre}</h2>
        <button onClick={finalizar} className="btn-finalizar" disabled={cargando}>
          Finalizar
        </button>
      </div>

      {mostrarConfirmacion && (
        <div className="modal-confirmacion">
          <div className="modal-content">
            <h3>Confirmar Invalidación de Respuestas</h3>
            <p>Se invalidarán {respuestasInvalidadas.length} respuesta(s):</p>
            <ul>
              {respuestasInvalidadas.map((r, idx) => (
                <li key={idx}>{r.texto}</li>
              ))}
            </ul>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setRespuestasInvalidadas([]);
                }}
                className="btn-continuar"
              >
                Continuar
              </button>
              <button
                onClick={deshacer}
                className="btn-deshacer"
              >
                Deshacer (30s)
              </button>
            </div>
          </div>
        </div>
      )}

      {preguntaActual ? (
        <div className="pregunta-actual">
          <h3>{preguntaActual.texto}</h3>
          {preguntaActual.validaciones?.requerido && (
            <span className="badge-requerido">Requerida</span>
          )}

          <div className="input-respuesta">
            {renderizarInputPregunta()}
          </div>

          <div className="acciones-pregunta">
            {allowBacktrack && historial.length > 1 && (
              <button onClick={deshacer} className="btn-atras">
                ← Atrás
              </button>
            )}
            <button
              onClick={aplicarRespuesta}
              disabled={!respuestaActual || cargando}
              className="btn-continuar"
            >
              {cargando ? 'Guardando...' : 'Continuar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="sin-preguntas">
          <p>No hay más preguntas. Puedes finalizar la ejecución.</p>
        </div>
      )}
    </div>
  );
}

