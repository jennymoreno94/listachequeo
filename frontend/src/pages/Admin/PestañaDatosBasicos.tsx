import { useForm } from 'react-hook-form';
import { usePlantillaStore } from '../../stores/plantillaStore';
import { useEffect } from 'react';
import { plantillasApi } from '../../services/api';
import './PestañaDatosBasicos.css';

interface PestañaDatosBasicosProps {
  plantillaId?: string | null;
}

export default function PestañaDatosBasicos({ plantillaId }: PestañaDatosBasicosProps) {
  const { configuracion, actualizarDatosBasicos } = usePlantillaStore();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: configuracion?.datosBasicos || {
      nombre: '',
      descripcion: '',
      duracionEstimada: 10,
      allowBacktrack: true,
      maxDepth: 10,
      exigirRespuestas: true,
    },
  });

  useEffect(() => {
    if (configuracion?.datosBasicos) {
      // Resetear el formulario completo con los nuevos valores
      reset({
        nombre: configuracion.datosBasicos.nombre || '',
        descripcion: configuracion.datosBasicos.descripcion || '',
        duracionEstimada: configuracion.datosBasicos.duracionEstimada || 10,
        allowBacktrack: configuracion.datosBasicos.allowBacktrack ?? true,
        maxDepth: configuracion.datosBasicos.maxDepth || 10,
        exigirRespuestas: configuracion.datosBasicos.exigirRespuestas ?? true,
      });
    }
  }, [configuracion?.datosBasicos, reset]);

  const onSubmit = async (data: any) => {
    actualizarDatosBasicos(data);
    
    // Si no hay plantillaId, crear una nueva
    if (!plantillaId && data.nombre) {
      try {
        await plantillasApi.crear({
          nombre: data.nombre,
          descripcion: data.descripcion,
        });
        alert(`Plantilla "${data.nombre}" creada exitosamente. Ahora puedes guardar borrador o publicar.`);
        // Recargar la página o actualizar el estado para reflejar el nuevo ID
        window.location.reload();
      } catch (error) {
        console.error('Error al crear plantilla:', error);
        alert('Error al crear plantilla. Verifica que el nombre sea único.');
      }
    } else {
      alert('Datos básicos guardados');
    }
  };

  return (
    <div className="pestaña-datos-basicos">
      <h3>Datos Básicos de la Plantilla</h3>
      <form 
        key={configuracion?.datosBasicos?.nombre || 'new'} 
        onSubmit={handleSubmit(onSubmit)} 
        className="form-datos-basicos"
      >
        <div className="form-group">
          <label htmlFor="nombre">Nombre de la Plantilla *</label>
          <input
            id="nombre"
            type="text"
            {...register('nombre', { required: true })}
            placeholder="Ej: Revisión de Nevera"
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            {...register('descripcion')}
            placeholder="Descripción opcional de la plantilla"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="duracionEstimada">Duración Estimada (minutos) *</label>
          <input
            id="duracionEstimada"
            type="number"
            {...register('duracionEstimada', { required: true, min: 1 })}
            min={1}
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              {...register('allowBacktrack')}
            />
            Permitir volver atrás durante la ejecución
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="maxDepth">Profundidad Máxima</label>
          <input
            id="maxDepth"
            type="number"
            {...register('maxDepth', { required: true, min: 1, max: 50 })}
            min={1}
            max={50}
          />
          <small>
            Límite de seguridad para evitar bucles infinitos. Representa cuántos niveles de preguntas conectadas puede tener tu checklist (como contar escalones desde la primera pregunta). Valor recomendado: 10. Rango: 1-50.
          </small>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              {...register('exigirRespuestas')}
            />
            Exigir respuestas solo para preguntas requeridas en el camino visible
          </label>
        </div>

        <button type="submit" className="btn-guardar">
          Guardar Datos Básicos
        </button>
      </form>
    </div>
  );
}

