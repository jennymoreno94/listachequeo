import { useEffect, useState } from 'react';
import { plantillasApi, Plantilla } from '../../services/api';
import './ListaPlantillas.css';

interface ListaPlantillasProps {
  onEditar: (id: string) => void;
}

export default function ListaPlantillas({ onEditar }: ListaPlantillasProps) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      setCargando(true);
      const response = await plantillasApi.listar();
      setPlantillas(response.data);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      alert('Error al cargar plantillas');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div className="lista-plantillas">Cargando plantillas...</div>;
  }

  return (
    <div className="lista-plantillas">
      <h2>Plantillas de Checklist</h2>
      <div className="plantillas-grid">
        {plantillas.map((plantilla) => (
          <div key={plantilla.id} className="plantilla-card">
            <h3>{plantilla.nombre}</h3>
            {plantilla.descripcion && <p>{plantilla.descripcion}</p>}
            <div className="plantilla-meta">
              <span className={`estado estado-${plantilla.estado.toLowerCase()}`}>
                {plantilla.estado}
              </span>
              {plantilla.versiones && plantilla.versiones.length > 0 && (
                <span>Versión {plantilla.versiones[0].version}</span>
              )}
            </div>
            <button onClick={() => onEditar(plantilla.id)} className="btn-editar">
              Editar
            </button>
          </div>
        ))}
        {plantillas.length === 0 && (
          <p>No hay plantillas. Crea una nueva desde "Nuevo Constructor".</p>
        )}
      </div>
    </div>
  );
}

