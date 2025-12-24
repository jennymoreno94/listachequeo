import { useState } from 'react';
import { usePlantillaStore } from '../../stores/plantillaStore';
import { plantillasApi } from '../../services/api';
import './PestañaValidar.css';

interface PestañaValidarProps {
  plantillaId?: string | null;
}

export default function PestañaValidar({ plantillaId }: PestañaValidarProps) {
  const { configuracion } = usePlantillaStore();
  const [validando, setValidando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [resultadoValidacion, setResultadoValidacion] = useState<any>(null);

  const handleValidar = async () => {
    if (!configuracion) {
      alert('No hay configuración para validar');
      return;
    }

    try {
      setValidando(true);
      const response = await plantillasApi.validar(plantillaId || 'temp', configuracion);
      setResultadoValidacion(response.data);
    } catch (error: any) {
      console.error('Error al validar:', error);
      if (error.response?.data) {
        setResultadoValidacion(error.response.data);
      } else {
        alert('Error al validar la configuración');
      }
    } finally {
      setValidando(false);
    }
  };

  const handleGuardarBorrador = async () => {
    if (!configuracion || !plantillaId) {
      alert('Debes crear la plantilla primero o tener una plantilla seleccionada');
      return;
    }

    try {
      await plantillasApi.guardarBorrador(plantillaId, configuracion);
      alert('Borrador guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar borrador:', error);
      alert('Error al guardar borrador');
    }
  };

  const handlePublicar = async () => {
    if (!configuracion || !plantillaId) {
      alert('Debes crear la plantilla primero o tener una plantilla seleccionada');
      return;
    }

    if (!resultadoValidacion || !resultadoValidacion.valido) {
      alert('Debes validar la configuración primero y que no tenga errores');
      return;
    }

    if (!confirm('¿Estás seguro de publicar esta versión? Una vez publicada, será inmutable.')) {
      return;
    }

    try {
      setPublicando(true);
      const response = await plantillasApi.publicar(plantillaId, configuracion);
      alert(`Versión ${response.data.version} publicada exitosamente`);
      setResultadoValidacion(null);
    } catch (error: any) {
      console.error('Error al publicar:', error);
      if (error.response?.data) {
        alert(`Error: ${error.response.data.message || 'Error al publicar'}`);
      } else {
        alert('Error al publicar la plantilla');
      }
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div className="pestaña-validar">
      <h3>Validar y Publicar Plantilla</h3>

      <div className="acciones-validacion">
        <button
          onClick={handleValidar}
          disabled={!configuracion || validando}
          className="btn-validar"
        >
          {validando ? 'Validando...' : 'Validar Configuración'}
        </button>

        {plantillaId && (
          <>
            <button
              onClick={handleGuardarBorrador}
              disabled={!configuracion}
              className="btn-guardar-borrador"
            >
              Guardar Borrador
            </button>

            <button
              onClick={handlePublicar}
              disabled={!configuracion || !resultadoValidacion?.valido || publicando}
              className="btn-publicar"
            >
              {publicando ? 'Publicando...' : 'Publicar Versión'}
            </button>
          </>
        )}
      </div>

      {!plantillaId && (
        <div className="advertencia">
          <strong>Nota:</strong> Para guardar borrador o publicar, primero debes crear la plantilla.
          Completa los datos básicos (especialmente el nombre) y luego crea la plantilla desde el botón "Crear Plantilla" en la pestaña "Datos Básicos".
        </div>
      )}

      {resultadoValidacion && (
        <div className="resultado-validacion">
          <h4>Resultado de la Validación</h4>

          {resultadoValidacion.valido ? (
            <div className="validacion-exitosa">
              <p>✅ La configuración es válida y está lista para publicar.</p>
            </div>
          ) : (
            <div className="validacion-error">
              <p>❌ La configuración tiene errores que deben corregirse antes de publicar.</p>
            </div>
          )}

          {resultadoValidacion.errores && resultadoValidacion.errores.length > 0 && (
            <div className="errores">
              <h5>Errores:</h5>
              <ul>
                {resultadoValidacion.errores.map((error: any, idx: number) => (
                  <li key={idx}>
                    <strong>{error.campo}:</strong> {error.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultadoValidacion.warnings && resultadoValidacion.warnings.length > 0 && (
            <div className="warnings">
              <h5>Advertencias:</h5>
              <ul>
                {resultadoValidacion.warnings.map((warning: any, idx: number) => (
                  <li key={idx}>
                    <strong>{warning.campo}:</strong> {warning.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="info-validacion">
        <h4>Información sobre Validación y Publicación</h4>
        <ul>
          <li>
            <strong>Validar:</strong> Verifica que la configuración cumpla con todas las reglas
            (estructura, referencias válidas, etc.)
          </li>
          <li>
            <strong>Guardar Borrador:</strong> Guarda la configuración como borrador para
            continuar editando más tarde.
          </li>
          <li>
            <strong>Publicar:</strong> Crea una versión inmutable de la plantilla con un checksum.
            Una vez publicada, no se puede modificar, solo crear nuevas versiones.
          </li>
        </ul>
      </div>
    </div>
  );
}

