import { useState, useEffect } from 'react';
import { usePlantillaStore, Transicion } from '../../stores/plantillaStore';
import './PestañaTransiciones.css';

export default function PestañaTransiciones() {
  const { configuracion, agregarTransicion, actualizarTransicion, eliminarTransicion } = usePlantillaStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [transicionEditando, setTransicionEditando] = useState<Transicion | null>(null);
  const [siguientesSeleccionadas, setSiguientesSeleccionadas] = useState<string[]>([]);
  const [preguntaSeleccionadaId, setPreguntaSeleccionadaId] = useState<string>('');

  // Inicializar siguientesSeleccionadas cuando se edita una transición
  useEffect(() => {
    if (transicionEditando) {
      setSiguientesSeleccionadas(transicionEditando.siguientesPreguntas || []);
      setPreguntaSeleccionadaId(transicionEditando.desdePreguntaId || '');
    } else {
      setSiguientesSeleccionadas([]);
      setPreguntaSeleccionadaId('');
    }
  }, [transicionEditando]);

  const operadores = [
    { value: 'EQUALS', label: 'Igual a' },
    { value: 'GT', label: 'Mayor que (>)' },
    { value: 'LT', label: 'Menor que (<)' },
  ];

  const preguntas = configuracion?.preguntas || [];
  const transiciones = configuracion?.transiciones || [];

  const handleGuardar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Usar las preguntas seleccionadas en lugar de parsear texto
    const siguienteIds = siguientesSeleccionadas.length > 0 
      ? siguientesSeleccionadas 
      : (formData.get('siguientesPreguntas') as string)
          ?.split(',')
          .map(id => id.trim())
          .filter(id => id) || [];

    if (siguienteIds.length === 0) {
      alert('Debes seleccionar al menos una pregunta siguiente');
      return;
    }

    const transicion: Transicion = {
      id: transicionEditando?.id || `t${Date.now()}`,
      desdePreguntaId: formData.get('desdePreguntaId') as string,
      operador: formData.get('operador') as any,
      siguientesPreguntas: siguienteIds,
      prioridad: Number(formData.get('prioridad')),
      esDefault: formData.get('esDefault') === 'on',
    };

    // Valor solo si no es IS_EMPTY o IS_NOT_EMPTY
    if (transicion.operador !== 'IS_EMPTY' && transicion.operador !== 'IS_NOT_EMPTY') {
      const valorTexto = formData.get('valor') as string;
      if (valorTexto) {
        if (transicion.operador === 'IN') {
          transicion.valor = valorTexto.split(',').map(v => v.trim());
        } else if (!isNaN(Number(valorTexto))) {
          transicion.valor = Number(valorTexto);
        } else {
          transicion.valor = valorTexto;
        }
      }
    }

    if (transicionEditando) {
      actualizarTransicion(transicion.id, transicion);
    } else {
      agregarTransicion(transicion);
    }

    setMostrarFormulario(false);
    setTransicionEditando(null);
    setSiguientesSeleccionadas([]);
    (e.target as HTMLFormElement).reset();
  };

  const handleEditar = (transicion: Transicion) => {
    setTransicionEditando(transicion);
    setPreguntaSeleccionadaId(transicion.desdePreguntaId || '');
    setMostrarFormulario(true);
  };

  const toggleSiguientePregunta = (preguntaId: string) => {
    setSiguientesSeleccionadas(prev => {
      if (prev.includes(preguntaId)) {
        return prev.filter(id => id !== preguntaId);
      } else {
        return [...prev, preguntaId];
      }
    });
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta transición?')) {
      eliminarTransicion(id);
    }
  };

  return (
    <div className="pestaña-transiciones">
      <div className="transiciones-header">
        <h3>Reglas de Navegación (Transiciones)</h3>
          <button
          onClick={() => {
            setTransicionEditando(null);
            setSiguientesSeleccionadas([]);
            setPreguntaSeleccionadaId('');
            setMostrarFormulario(true);
          }}
          className="btn-nuevo"
          disabled={preguntas.length === 0}
        >
          + Nueva Transición
        </button>
      </div>

      {preguntas.length === 0 && (
        <p className="advertencia">
          Primero debes crear al menos una pregunta en la pestaña "Preguntas".
        </p>
      )}

      {mostrarFormulario && (
        <div className="formulario-transicion">
          <h4>{transicionEditando ? 'Editar Transición' : 'Nueva Transición'}</h4>
          <form onSubmit={handleGuardar}>
            <div className="form-group">
              <label>Desde Pregunta *</label>
              <select
                name="desdePreguntaId"
                required
                defaultValue={transicionEditando?.desdePreguntaId || ''}
                onChange={(e) => setPreguntaSeleccionadaId(e.target.value)}
              >
                <option value="">Seleccionar pregunta...</option>
                {preguntas.map(p => (
                  <option key={p.id} value={p.id}>
                    [ID: {p.id}] {p.texto}
                  </option>
                ))}
              </select>
              <small>
                <strong>¿Qué pregunta activa esta regla?</strong> Selecciona la pregunta que el usuario está respondiendo. 
                Cuando la respuesta de esta pregunta cumpla las condiciones, se mostrarán las siguientes preguntas.
              </small>
            </div>

            <div className="form-group">
              <label>Operador *</label>
              <select
                name="operador"
                required
                defaultValue={transicionEditando?.operador || ''}
              >
                <option value="">Seleccionar operador...</option>
                {operadores.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              <small>
                <strong>¿Cómo comparar la respuesta?</strong> 
                <ul style={{ marginTop: '5px', paddingLeft: '20px', marginBottom: 0 }}>
                  <li><strong>Igual a:</strong> La respuesta debe ser exactamente igual al valor (ej: respuesta = "rota")</li>
                  <li><strong>Mayor que:</strong> Para números, la respuesta debe ser mayor (ej: temperatura &gt; 10)</li>
                  <li><strong>Menor que:</strong> Para números, la respuesta debe ser menor (ej: temperatura &lt; 5)</li>
                </ul>
              </small>
            </div>

            <div className="form-group">
              <label>Valor *</label>
              {(() => {
                const preguntaSeleccionada = preguntas.find(p => p.id === preguntaSeleccionadaId);
                const esPreguntaSeleccion = preguntaSeleccionada?.tipo === 'UNA_OPCION' || preguntaSeleccionada?.tipo === 'MULTIPLES_OPCIONES';
                const opciones = preguntaSeleccionada?.opciones || [];
                const valorActual = transicionEditando?.valor
                  ? Array.isArray(transicionEditando.valor)
                    ? transicionEditando.valor.join(', ')
                    : String(transicionEditando.valor)
                  : '';

                if (esPreguntaSeleccion && opciones.length > 0) {
                  // Mostrar selector de opciones si la pregunta es de selección
                  return (
                    <>
                      <select
                        name="valor"
                        required
                        key={`valor-select-${transicionEditando?.id || 'new'}-${preguntaSeleccionadaId}`}
                        defaultValue={valorActual}
                        style={{ width: '100%', padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #4a90e2' }}
                      >
                        <option value="">Seleccionar opción...</option>
                        {opciones.map(opcion => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label} ({opcion.value})
                          </option>
                        ))}
                      </select>
                      <small>
                        <strong>¿Qué opción debe seleccionar el usuario?</strong> Selecciona la opción exacta que debe elegir el usuario para que se active esta regla.
                      </small>
                    </>
                  );
                } else {
                  // Mostrar campo de texto para otros tipos de preguntas
                  return (
                    <>
                      <input
                        type="text"
                        name="valor"
                        required
                        key={`valor-input-${transicionEditando?.id || 'new'}-${preguntaSeleccionadaId}`}
                        defaultValue={valorActual}
                        placeholder='Ej: "rota", "si", "no", 10, 25'
                      />
                      <small>
                        <strong>¿Qué valor debe tener la respuesta?</strong> Escribe exactamente el valor que debe tener la respuesta para que se active esta regla.
                        <ul style={{ marginTop: '5px', paddingLeft: '20px', marginBottom: 0 }}>
                          <li><strong>Para texto:</strong> Escribe el valor exacto entre comillas o sin comillas (ej: rota, si, no)</li>
                          <li><strong>Para números:</strong> Escribe solo el número (ej: 10, 25, 100)</li>
                          <li><strong>Ejemplo:</strong> Si el operador es "Igual a" y el valor es "rota", la regla se activará solo si el usuario responde exactamente "rota"</li>
                        </ul>
                      </small>
                    </>
                  );
                }
              })()}
            </div>

            <div className="form-group">
              <label>Siguientes Preguntas *</label>
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '10px', 
                maxHeight: '200px', 
                overflowY: 'auto',
                backgroundColor: '#f9f9f9',
                minHeight: '100px'
              }}>
                {preguntas.length === 0 ? (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>
                    No hay preguntas disponibles. Crea preguntas primero en la pestaña "Preguntas".
                  </p>
                ) : (
                  preguntas.map(p => (
                    <label 
                      key={p.id} 
                      style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                        border: siguientesSeleccionadas.includes(p.id) ? '2px solid #4a90e2' : '1px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!siguientesSeleccionadas.includes(p.id)) {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!siguientesSeleccionadas.includes(p.id)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={siguientesSeleccionadas.includes(p.id)}
                        onChange={() => toggleSiguientePregunta(p.id)}
                        style={{ marginRight: '10px', cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                      <span style={{ fontWeight: '500' }}>{p.texto}</span>
                      <span style={{ 
                        color: '#999', 
                        fontSize: '0.85em', 
                        marginLeft: '8px',
                        fontStyle: 'italic'
                      }}>
                        (ID: {p.id})
                      </span>
                    </label>
                  ))
                )}
              </div>
              <input
                type="hidden"
                name="siguientesPreguntas"
                value={siguientesSeleccionadas.join(', ')}
              />
              {siguientesSeleccionadas.length === 0 && mostrarFormulario && (
                <p style={{ color: '#d32f2f', fontSize: '0.9em', marginTop: '5px', fontWeight: 'bold' }}>
                  ⚠️ Debes seleccionar al menos una pregunta siguiente.
                </p>
              )}
              <small style={{ color: '#666', fontSize: '0.9em', display: 'block', marginTop: '5px' }}>
                <strong>¿Qué preguntas mostrar después?</strong> Simplemente marca las casillas de las preguntas que quieres que aparezcan cuando esta regla se active. 
                Puedes seleccionar una o varias preguntas. El ID entre paréntesis es solo para referencia técnica - no necesitas recordarlo ni escribirlo manualmente.
              </small>
            </div>

            <div className="form-group">
              <label>Prioridad *</label>
              <input
                type="number"
                name="prioridad"
                required
                min={0}
                defaultValue={transicionEditando?.prioridad ?? 10}
              />
              <small>
                <strong>¿Cuándo se evalúa esta regla?</strong> Si la misma pregunta tiene varias reglas (por ejemplo, una para "Sí" y otra para "No"), 
                el sistema evaluará primero las reglas con mayor número de prioridad. Valor recomendado: 10.
              </small>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="esDefault"
                  defaultChecked={transicionEditando?.esDefault}
                />
                Esta es la regla por defecto (aplica si ninguna otra coincide)
              </label>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-guardar"
                disabled={siguientesSeleccionadas.length === 0}
              >
                {transicionEditando ? 'Actualizar' : 'Crear'} Transición
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setTransicionEditando(null);
                  setSiguientesSeleccionadas([]);
                  setPreguntaSeleccionadaId('');
                }}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
            {siguientesSeleccionadas.length === 0 && (
              <p style={{ color: '#d32f2f', fontSize: '0.9em', marginTop: '5px', fontWeight: 'bold' }}>
                ⚠️ Debes seleccionar al menos una pregunta siguiente para guardar la transición.
              </p>
            )}
            <div className="info-guardado" style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              💡 <strong>Nota:</strong> La transición se guardará en la plantilla. Recuerda guardar el borrador o publicar la plantilla para persistir los cambios en la base de datos.
            </div>
          </form>
        </div>
      )}

      <div className="lista-transiciones">
        {transiciones.length === 0 ? (
          <p className="sin-transiciones">
            No hay transiciones. Crea reglas para definir el flujo del checklist.
          </p>
        ) : (
          transiciones.map((transicion) => {
            const preguntaDesde = preguntas.find(p => p.id === transicion.desdePreguntaId);
            return (
              <div key={transicion.id} className="transicion-card">
                <div className="transicion-header">
                  <h4>
                    {preguntaDesde?.texto || transicion.desdePreguntaId}
                    {transicion.esDefault && <span className="badge-default">DEFAULT</span>}
                  </h4>
                  <span className="prioridad-badge">Prioridad: {transicion.prioridad}</span>
                </div>
                <div className="transicion-info">
                  <div className="regla">
                    <strong>Si:</strong> {operadores.find(o => o.value === transicion.operador)?.label}
                    {transicion.operador !== 'IS_EMPTY' && transicion.operador !== 'IS_NOT_EMPTY' && (
                      <span> = {Array.isArray(transicion.valor) ? transicion.valor.join(', ') : String(transicion.valor || '')}</span>
                    )}
                  </div>
                  <div className="siguientes">
                    <strong>Entonces mostrar:</strong>
                    <ul>
                      {transicion.siguientesPreguntas.map(id => {
                        const pregunta = preguntas.find(p => p.id === id);
                        return (
                          <li key={id}>
                            {pregunta?.texto || id}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
                <div className="transicion-actions">
                  <button onClick={() => handleEditar(transicion)} className="btn-editar">
                    Editar
                  </button>
                  <button onClick={() => handleEliminar(transicion.id)} className="btn-eliminar">
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

