import { useState, useEffect } from 'react';
import { usePlantillaStore, Pregunta } from '../../stores/plantillaStore';
import './PestañaPreguntas.css';

export default function PestañaPreguntas() {
  const { configuracion, agregarPregunta, actualizarPregunta, eliminarPregunta } = usePlantillaStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [preguntaEditando, setPreguntaEditando] = useState<Pregunta | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('');
  
  // Actualizar tipoSeleccionado cuando se edita una pregunta
  useEffect(() => {
    if (preguntaEditando) {
      setTipoSeleccionado(preguntaEditando.tipo);
    } else {
      setTipoSeleccionado('');
    }
  }, [preguntaEditando]);

  const tiposPregunta = [
    { value: 'UNA_OPCION', label: 'Una Opción' },
    { value: 'MULTIPLES_OPCIONES', label: 'Múltiples Opciones' },
    { value: 'TEXTO', label: 'Texto' },
    { value: 'NUMERO', label: 'Número' },
    { value: 'FOTO_URL', label: 'URL de Foto' },
    { value: 'FECHA', label: 'Fecha' },
  ];

  const handleGuardar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Generar ID simple y secuencial (p1, p2, p3...)
    let nuevoId = preguntaEditando?.id;
    if (!nuevoId) {
      const preguntasExistentes = configuracion?.preguntas || [];
      const numerosIds = preguntasExistentes
        .map(p => {
          const match = p.id.match(/^p(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      const siguienteNumero = numerosIds.length > 0 ? Math.max(...numerosIds) + 1 : 1;
      nuevoId = `p${siguienteNumero}`;
    }
    
    const pregunta: Pregunta = {
      id: nuevoId,
      texto: formData.get('texto') as string,
      tipo: formData.get('tipo') as any,
      esInicial: formData.get('esInicial') === 'on',
      validaciones: {
        requerido: formData.get('requerido') === 'on',
        // Campos min, max y patron ocultos para MVP - se implementarán después
        // min: formData.get('min') ? Number(formData.get('min')) : undefined,
        // max: formData.get('max') ? Number(formData.get('max')) : undefined,
        // patron: formData.get('patron') as string || undefined,
      },
    };

    // Opciones para tipos de selección
    if (pregunta.tipo === 'UNA_OPCION' || pregunta.tipo === 'MULTIPLES_OPCIONES') {
      const opcionesTexto = formData.get('opciones') as string;
      if (opcionesTexto) {
        pregunta.opciones = opcionesTexto
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [value, ...labelParts] = line.split(':');
            return {
              value: value.trim(),
              label: labelParts.join(':').trim() || value.trim(),
            };
          });
      }
    }

    if (preguntaEditando) {
      actualizarPregunta(pregunta.id, pregunta);
    } else {
      agregarPregunta(pregunta);
    }

    setMostrarFormulario(false);
    setPreguntaEditando(null);
    setTipoSeleccionado('');
    (e.target as HTMLFormElement).reset();
  };

  const handleEditar = (pregunta: Pregunta) => {
    setPreguntaEditando(pregunta);
    setTipoSeleccionado(pregunta.tipo);
    setMostrarFormulario(true);
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      eliminarPregunta(id);
    }
  };

  const preguntas = configuracion?.preguntas || [];
  const necesitaOpciones = tipoSeleccionado === 'UNA_OPCION' || tipoSeleccionado === 'MULTIPLES_OPCIONES' || preguntaEditando?.tipo === 'UNA_OPCION' || preguntaEditando?.tipo === 'MULTIPLES_OPCIONES';

  return (
    <div className="pestaña-preguntas">
      <div className="preguntas-header">
        <h3>Preguntas del Checklist</h3>
        <button
          onClick={() => {
            setPreguntaEditando(null);
            setTipoSeleccionado('');
            setMostrarFormulario(true);
          }}
          className="btn-nuevo"
        >
          + Nueva Pregunta
        </button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-pregunta">
          <h4>{preguntaEditando ? 'Editar Pregunta' : 'Nueva Pregunta'}</h4>
          <form onSubmit={handleGuardar}>
            <div className="form-group">
              <label>Texto de la Pregunta *</label>
              <input
                type="text"
                name="texto"
                required
                defaultValue={preguntaEditando?.texto}
                placeholder="Ej: ¿Cuál es el estado de la puerta?"
              />
              <small style={{ color: '#666', fontSize: '0.9em' }}>
                <strong>¿Qué pregunta le harás al usuario?</strong> Escribe el texto completo de la pregunta que aparecerá durante la ejecución del checklist.
              </small>
            </div>

            <div className="form-group">
              <label>Tipo de Pregunta *</label>
              <select 
                name="tipo" 
                required 
                key={preguntaEditando?.id || 'new'} // Force re-render when editing changes
                defaultValue={preguntaEditando?.tipo || tipoSeleccionado || ''}
                onChange={(e) => setTipoSeleccionado(e.target.value)}
              >
                <option value="">Seleccionar tipo...</option>
                {tiposPregunta.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '0.9em' }}>
                <strong>¿Qué tipo de respuesta esperas?</strong> 
                <ul style={{ marginTop: '5px', paddingLeft: '20px', marginBottom: 0 }}>
                  <li><strong>Una Opción:</strong> El usuario selecciona una respuesta de una lista (ej: Sí/No, Bueno/Regular/Malo)</li>
                  <li><strong>Múltiples Opciones:</strong> El usuario puede seleccionar varias respuestas</li>
                  <li><strong>Texto:</strong> El usuario escribe texto libre</li>
                  <li><strong>Número:</strong> El usuario ingresa un número</li>
                  <li><strong>URL de Foto:</strong> El usuario proporciona una URL de una imagen</li>
                  <li><strong>Fecha:</strong> El usuario selecciona una fecha</li>
                </ul>
              </small>
            </div>

            {necesitaOpciones && (
              <div className="form-group">
                <label>Opciones (una por línea, formato: value:label) *</label>
                <textarea
                  name="opciones"
                  rows={5}
                  required={necesitaOpciones}
                  placeholder="rota:Rota&#10;sumida:Sumida&#10;buena:Buena"
                  defaultValue={preguntaEditando?.opciones?.map(o => `${o.value}:${o.label}`).join('\n')}
                />
                <small style={{ color: '#666', fontSize: '0.9em' }}>
                  <strong>¿Qué opciones puede elegir el usuario?</strong> 
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', marginBottom: 0 }}>
                    <li><strong>Formato:</strong> valor:Etiqueta (una opción por línea)</li>
                    <li><strong>Valor:</strong> Es el ID interno que se usa en transiciones (ej: "rota", "si", "no")</li>
                    <li><strong>Etiqueta:</strong> Es lo que verá el usuario (ej: "Rota", "Sí", "No")</li>
                    <li><strong>Ejemplo:</strong> <code>rota:Rota</code> - El valor es "rota" pero el usuario verá "Rota"</li>
                  </ul>
                </small>
              </div>
            )}

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="esInicial"
                  defaultChecked={preguntaEditando?.esInicial}
                />
                Marcar como pregunta inicial
              </label>
              <small style={{ color: '#666', fontSize: '0.9em', display: 'block', marginTop: '5px' }}>
                <strong>¿Esta pregunta aparece al inicio del checklist?</strong> Solo marca una pregunta como inicial. 
                Es la primera pregunta que verá el usuario cuando ejecute el checklist.
              </small>
            </div>

            <div className="validaciones-section">
              <h5>Validaciones</h5>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="requerido"
                    defaultChecked={preguntaEditando?.validaciones?.requerido}
                  />
                  Respuesta requerida
                </label>
                <small style={{ color: '#666', fontSize: '0.9em', display: 'block', marginTop: '5px' }}>
                  <strong>¿El usuario debe responder esta pregunta?</strong> Si está marcada, el usuario no podrá finalizar el checklist sin responder esta pregunta.
                </small>
              </div>

              {/* Campos ocultos para MVP - Se implementarán en versión futura */}
              {/* 
              <div className="form-row">
                <div className="form-group">
                  <label>Valor Mínimo</label>
                  <input
                    type="number"
                    name="min"
                    defaultValue={preguntaEditando?.validaciones?.min}
                  />
                </div>
                <div className="form-group">
                  <label>Valor Máximo</label>
                  <input
                    type="number"
                    name="max"
                    defaultValue={preguntaEditando?.validaciones?.max}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Patrón (regex)</label>
                <input
                  type="text"
                  name="patron"
                  defaultValue={preguntaEditando?.validaciones?.patron}
                  placeholder="Ej: ^[A-Z]{2}[0-9]{4}$"
                />
              </div>
              */}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-guardar">
                {preguntaEditando ? 'Actualizar' : 'Crear'} Pregunta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setPreguntaEditando(null);
                  setTipoSeleccionado('');
                }}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
            <div className="info-guardado" style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              💡 <strong>Nota:</strong> La pregunta se guardará en la plantilla. Recuerda guardar el borrador o publicar la plantilla para persistir los cambios en la base de datos.
            </div>
          </form>
        </div>
      )}

      <div className="lista-preguntas">
        {preguntas.length === 0 ? (
          <p className="sin-preguntas">No hay preguntas. Crea la primera pregunta.</p>
        ) : (
          preguntas.map((pregunta) => (
            <div key={pregunta.id} className="pregunta-card">
              <div className="pregunta-header">
                <div>
                  <h4 style={{ display: 'inline', marginRight: '8px' }}>{pregunta.texto}</h4>
                  <span style={{ 
                    display: 'inline-block', 
                    backgroundColor: '#f5f5f5', 
                    color: '#666', 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    fontSize: '0.7em',
                    fontFamily: 'monospace',
                    marginRight: '8px'
                  }} title="ID interno de la pregunta">
                    {pregunta.id}
                  </span>
                </div>
                {pregunta.esInicial && <span className="badge-inicial">Inicial</span>}
              </div>
              <div className="pregunta-info">
                <span className="tipo-badge">{pregunta.tipo}</span>
                {pregunta.validaciones?.requerido && (
                  <span className="badge-requerido">Requerida</span>
                )}
              </div>
              {pregunta.opciones && pregunta.opciones.length > 0 && (
                <div className="pregunta-opciones">
                  <strong>Opciones:</strong>
                  <ul>
                    {pregunta.opciones.map((op, idx) => (
                      <li key={idx}>{op.label} ({op.value})</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pregunta-actions">
                <button onClick={() => handleEditar(pregunta)} className="btn-editar">
                  Editar
                </button>
                <button onClick={() => handleEliminar(pregunta.id)} className="btn-eliminar">
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

