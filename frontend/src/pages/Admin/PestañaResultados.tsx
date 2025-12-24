import { useState } from 'react';
import { usePlantillaStore, Resultado, CondicionResultado, AccionResultado } from '../../stores/plantillaStore';
import './PestañaResultados.css';

export default function PestañaResultados() {
  const { configuracion, agregarResultado, actualizarResultado, eliminarResultado } = usePlantillaStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [resultadoEditando, setResultadoEditando] = useState<Resultado | null>(null);

  const operadores = [
    { value: 'EQUALS', label: 'Igual a' },
    { value: 'GT', label: 'Mayor que (>)' },
    { value: 'LT', label: 'Menor que (<)' },
  ];

  const tiposAccion = [
    { value: 'ESCALATE', label: 'Escalar' },
    { value: 'ORDER_PART', label: 'Pedir Repuesto' },
    { value: 'SCHEDULE_FOLLOWUP', label: 'Agendar Seguimiento' },
    { value: 'NOTIFY', label: 'Notificar' },
    { value: 'LOG', label: 'Registrar en Log' },
  ];

  const preguntas = configuracion?.preguntas || [];
  const resultados = configuracion?.resultados || [];

  const handleGuardar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Leer condiciones (pueden ser múltiples)
    const condiciones: CondicionResultado[] = [];
    const numCondiciones = Number(formData.get('numCondiciones') || 1);
    
    for (let i = 0; i < numCondiciones; i++) {
      const preguntaId = formData.get(`condicion_${i}_preguntaId`) as string;
      const operador = formData.get(`condicion_${i}_operador`) as string;
      const valorTexto = formData.get(`condicion_${i}_valor`) as string;

      if (preguntaId && operador) {
        const condicion: CondicionResultado = {
          preguntaId,
          operador: operador as any,
        };

        if (operador !== 'IS_EMPTY' && operador !== 'IS_NOT_EMPTY' && valorTexto) {
          if (operador === 'IN') {
            condicion.valor = valorTexto.split(',').map(v => v.trim());
          } else if (!isNaN(Number(valorTexto))) {
            condicion.valor = Number(valorTexto);
          } else {
            condicion.valor = valorTexto;
          }
        }

        condiciones.push(condicion);
      }
    }

    // Leer acciones
    const acciones: AccionResultado[] = [];
    const numAcciones = Number(formData.get('numAcciones') || 1);

    for (let i = 0; i < numAcciones; i++) {
      const tipo = formData.get(`accion_${i}_tipo`) as string;
      const payloadTexto = formData.get(`accion_${i}_payload`) as string;

      if (tipo) {
        let payload = {};
        if (payloadTexto) {
          try {
            payload = JSON.parse(payloadTexto);
          } catch {
            // Si no es JSON válido, crear objeto simple
            payload = { mensaje: payloadTexto };
          }
        }

        acciones.push({
          tipo: tipo as any,
          payload,
        });
      }
    }

    const resultado: Resultado = {
      id: resultadoEditando?.id || `r${Date.now()}`,
      nombre: formData.get('nombre') as string,
      prioridad: Number(formData.get('prioridad')),
      condiciones,
      acciones,
    };

    if (resultadoEditando) {
      actualizarResultado(resultado.id, resultado);
    } else {
      agregarResultado(resultado);
    }

    setMostrarFormulario(false);
    setResultadoEditando(null);
  };

  const handleEditar = (resultado: Resultado) => {
    setResultadoEditando(resultado);
    setMostrarFormulario(true);
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este resultado?')) {
      eliminarResultado(id);
    }
  };

  return (
    <div className="pestaña-resultados">
      <div className="resultados-header">
        <h3>Resultados (Outcomes)</h3>
        <button
          onClick={() => {
            setResultadoEditando(null);
            setMostrarFormulario(true);
          }}
          className="btn-nuevo"
          disabled={preguntas.length === 0}
        >
          + Nuevo Resultado
        </button>
      </div>

      {preguntas.length === 0 && (
        <p className="advertencia">
          Primero debes crear al menos una pregunta en la pestaña "Preguntas".
        </p>
      )}

      {mostrarFormulario && (
        <FormularioResultado
          resultado={resultadoEditando}
          preguntas={preguntas}
          operadores={operadores}
          tiposAccion={tiposAccion}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarFormulario(false);
            setResultadoEditando(null);
          }}
        />
      )}

      <div className="lista-resultados">
        {resultados.length === 0 ? (
          <p className="sin-resultados">
            No hay resultados. Define outcomes que se aplicarán según las condiciones.
          </p>
        ) : (
          resultados.map((resultado) => (
            <div key={resultado.id} className="resultado-card">
              <div className="resultado-header">
                <h4>{resultado.nombre}</h4>
                <span className="prioridad-badge">Prioridad: {resultado.prioridad}</span>
              </div>
              <div className="resultado-info">
                <div className="condiciones">
                  <strong>Condiciones (TODAS deben cumplirse):</strong>
                  <ul>
                    {resultado.condiciones.map((cond, idx) => {
                      const pregunta = preguntas.find(p => p.id === cond.preguntaId);
                      return (
                        <li key={idx}>
                          {pregunta?.texto || cond.preguntaId}{' '}
                          {operadores.find(o => o.value === cond.operador)?.label}
                          {cond.operador !== 'IS_EMPTY' && cond.operador !== 'IS_NOT_EMPTY' && (
                            <span> {Array.isArray(cond.valor) ? cond.valor.join(', ') : String(cond.valor || '')}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="acciones">
                  <strong>Acciones:</strong>
                  <ul>
                    {resultado.acciones.map((accion, idx) => (
                      <li key={idx}>
                        <strong>{tiposAccion.find(t => t.value === accion.tipo)?.label}:</strong>{' '}
                        {JSON.stringify(accion.payload)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="resultado-actions">
                <button onClick={() => handleEditar(resultado)} className="btn-editar">
                  Editar
                </button>
                <button onClick={() => handleEliminar(resultado.id)} className="btn-eliminar">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FormularioResultado({
  resultado,
  preguntas,
  operadores,
  tiposAccion,
  onGuardar,
  onCancelar,
}: {
  resultado: Resultado | null;
  preguntas: any[];
  operadores: any[];
  tiposAccion: any[];
  onGuardar: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancelar: () => void;
}) {
  const [numCondiciones, setNumCondiciones] = useState(resultado?.condiciones.length || 1);
  const [numAcciones, setNumAcciones] = useState(resultado?.acciones.length || 1);
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState<{ [key: number]: string }>(() => {
    const estado: { [key: number]: string } = {};
    resultado?.condiciones.forEach((cond, idx) => {
      estado[idx] = cond.preguntaId;
    });
    return estado;
  });

  return (
    <div className="formulario-resultado">
      <h4>{resultado ? 'Editar Resultado' : 'Nuevo Resultado'}</h4>
      <form onSubmit={onGuardar}>
        <input type="hidden" name="numCondiciones" value={numCondiciones} />
        <input type="hidden" name="numAcciones" value={numAcciones} />

        <div className="form-group">
          <label>Nombre del Resultado *</label>
          <input
            type="text"
            name="nombre"
            required
            defaultValue={resultado?.nombre}
            placeholder="Ej: Puerta rota - Escalar"
          />
          <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85em' }}>
            <strong>¿Cómo se llama este resultado?</strong> Escribe un nombre descriptivo que explique qué resultado o conclusión representa este conjunto de condiciones y acciones.
          </small>
        </div>

        <div className="form-group">
          <label>Prioridad *</label>
          <input
            type="number"
            name="prioridad"
            required
            min={0}
            defaultValue={resultado?.prioridad || 10}
          />
          <small>
            <strong>¿Cuándo se evalúa este resultado?</strong> Si múltiples resultados cumplen sus condiciones al mismo tiempo, 
            se aplicarán todos, pero en orden de prioridad (mayor número = se evalúa primero). Valor recomendado: 10.
          </small>
        </div>

        <div className="condiciones-section">
          <div className="section-header">
            <h5>Condiciones (TODAS deben cumplirse - AND)</h5>
            <button
              type="button"
              onClick={() => {
                setNumCondiciones(numCondiciones + 1);
              }}
              className="btn-agregar"
            >
              + Agregar Condición
            </button>
          </div>
          <small style={{ display: 'block', marginBottom: '15px', color: '#666', fontSize: '0.9em' }}>
            <strong>¿Cuándo se activa este resultado?</strong> Define las condiciones que deben cumplirse simultáneamente. 
            Si TODAS las condiciones son verdaderas, se ejecutarán las acciones definidas. Puedes agregar múltiples condiciones.
          </small>
          {Array.from({ length: numCondiciones }).map((_, i) => {
            const condicion = resultado?.condiciones[i];
            const preguntaSeleccionada = preguntas.find(p => p.id === (preguntasSeleccionadas[i] || condicion?.preguntaId));
            const esPreguntaSeleccion = preguntaSeleccionada?.tipo === 'UNA_OPCION' || preguntaSeleccionada?.tipo === 'MULTIPLES_OPCIONES';
            const opciones = preguntaSeleccionada?.opciones || [];
            const valorActual = condicion?.valor
              ? Array.isArray(condicion.valor)
                ? condicion.valor.join(', ')
                : String(condicion.valor)
              : '';
            
            return (
              <div key={i} className="condicion-row" style={{ 
                border: '1px solid #e0e0e0', 
                padding: '15px', 
                borderRadius: '4px', 
                marginBottom: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Pregunta {i + 1} *
                  </label>
                  <select
                    name={`condicion_${i}_preguntaId`}
                    required
                    defaultValue={condicion?.preguntaId || ''}
                    onChange={(e) => {
                      setPreguntasSeleccionadas(prev => ({ ...prev, [i]: e.target.value }));
                    }}
                    style={{ width: '100%', padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #4a90e2' }}
                  >
                    <option value="">Seleccionar pregunta...</option>
                    {preguntas.map(p => (
                      <option key={p.id} value={p.id}>
                        [ID: {p.id}] {p.texto}
                      </option>
                    ))}
                  </select>
                  <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85em' }}>
                    Selecciona la pregunta cuya respuesta se evaluará en esta condición.
                  </small>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Operador *
                  </label>
                  <select
                    name={`condicion_${i}_operador`}
                    required
                    defaultValue={condicion?.operador || ''}
                    style={{ width: '100%', padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #4a90e2' }}
                  >
                    <option value="">Seleccionar operador...</option>
                    {operadores.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85em' }}>
                    <strong>¿Cómo comparar la respuesta?</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px', marginBottom: 0, fontSize: '0.9em' }}>
                      <li><strong>Igual a:</strong> La respuesta debe ser exactamente igual al valor</li>
                      <li><strong>Mayor que:</strong> Para números, la respuesta debe ser mayor (ej: temperatura &gt; 10)</li>
                      <li><strong>Menor que:</strong> Para números, la respuesta debe ser menor (ej: temperatura &lt; 5)</li>
                    </ul>
                  </small>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Valor *
                  </label>
                  {esPreguntaSeleccion && opciones.length > 0 ? (
                    <>
                      <select
                        name={`condicion_${i}_valor`}
                        required
                        key={`valor-select-${i}-${preguntasSeleccionadas[i] || condicion?.preguntaId}`}
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
                      <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85em' }}>
                        <strong>¿Qué opción debe seleccionar el usuario?</strong> Selecciona la opción exacta que debe elegir el usuario para que esta condición se cumpla.
                      </small>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        name={`condicion_${i}_valor`}
                        required
                        key={`valor-input-${i}-${preguntasSeleccionadas[i] || condicion?.preguntaId}`}
                        defaultValue={valorActual}
                        placeholder='Ej: "rota", "si", "no", 10, 25'
                        style={{ width: '100%', padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #4a90e2' }}
                      />
                      <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85em' }}>
                        <strong>¿Qué valor debe tener la respuesta?</strong> Escribe exactamente el valor que debe tener la respuesta para que esta condición se cumpla.
                        <ul style={{ marginTop: '5px', paddingLeft: '20px', marginBottom: 0, fontSize: '0.9em' }}>
                          <li><strong>Para texto:</strong> Escribe el valor exacto (ej: rota, si, no)</li>
                          <li><strong>Para números:</strong> Escribe solo el número (ej: 10, 25, 100)</li>
                        </ul>
                      </small>
                    </>
                  )}
                </div>

                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNumCondiciones(numCondiciones - 1);
                      const nuevasPreguntas = { ...preguntasSeleccionadas };
                      delete nuevasPreguntas[i];
                      // Reindexar
                      const reindexadas: { [key: number]: string } = {};
                      Object.keys(nuevasPreguntas).forEach(key => {
                        const idx = Number(key);
                        if (idx < i) reindexadas[idx] = nuevasPreguntas[idx];
                        else if (idx > i) reindexadas[idx - 1] = nuevasPreguntas[idx];
                      });
                      setPreguntasSeleccionadas(reindexadas);
                    }}
                    className="btn-eliminar-condicion"
                    style={{ 
                      backgroundColor: '#d32f2f', 
                      color: 'white', 
                      border: 'none', 
                      padding: '8px 15px', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    × Eliminar esta condición
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="acciones-section">
          <div className="section-header">
            <h5>Acciones</h5>
            <button
              type="button"
              onClick={() => setNumAcciones(numAcciones + 1)}
              className="btn-agregar"
            >
              + Agregar Acción
            </button>
          </div>
          <small style={{ display: 'block', marginBottom: '15px', color: '#666', fontSize: '0.9em' }}>
            <strong>¿Qué debe hacer el sistema cuando se cumplan las condiciones?</strong> Define las acciones que se ejecutarán automáticamente 
            cuando todas las condiciones se cumplan. Puedes agregar múltiples acciones.
          </small>
          {Array.from({ length: numAcciones }).map((_, i) => {
            const accion = resultado?.acciones[i];
            return (
              <div key={i} className="accion-row" style={{ 
                border: '1px solid #e0e0e0', 
                padding: '15px', 
                borderRadius: '4px', 
                marginBottom: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Tipo de Acción {i + 1} *
                  </label>
                  <select
                    name={`accion_${i}_tipo`}
                    required
                    defaultValue={accion?.tipo || ''}
                    style={{ width: '100%', padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #4a90e2' }}
                  >
                    <option value="">Seleccionar acción...</option>
                    {tiposAccion.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85em' }}>
                    Selecciona el tipo de acción que debe ejecutarse cuando se cumplan las condiciones.
                  </small>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Detalles (Payload) <span style={{ color: '#666', fontWeight: 'normal', fontSize: '0.9em' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    name={`accion_${i}_payload`}
                    defaultValue={accion ? JSON.stringify(accion.payload) : ''}
                    placeholder='JSON: {"nivel": "alto", "motivo": "puerta rota"}'
                    style={{ width: '100%', padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #4a90e2' }}
                  />
                  <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85em' }}>
                    <strong>¿Qué información adicional necesita la acción?</strong> Escribe un objeto JSON con datos adicionales que la acción necesita. 
                    Por ejemplo: <code>{"{"}"nivel": "alto", "motivo": "puerta rota"{"}"}</code>. Si no es necesario, puedes dejar este campo vacío.
                  </small>
                </div>

                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setNumAcciones(numAcciones - 1)}
                    className="btn-eliminar-accion"
                    style={{ 
                      backgroundColor: '#d32f2f', 
                      color: 'white', 
                      border: 'none', 
                      padding: '8px 15px', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    × Eliminar esta acción
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-guardar">
            {resultado ? 'Actualizar' : 'Crear'} Resultado
          </button>
          <button type="button" onClick={onCancelar} className="btn-cancelar">
            Cancelar
          </button>
        </div>
        <div className="info-guardado" style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
          💡 <strong>Nota:</strong> El resultado se guardará en la plantilla. Recuerda guardar el borrador o publicar la plantilla para persistir los cambios en la base de datos.
        </div>
      </form>
    </div>
  );
}

