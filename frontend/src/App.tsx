import { useState } from 'react'
import ConstructorPlantilla from './pages/Admin/ConstructorPlantilla'
import RunnerEjecucion from './pages/Tecnico/RunnerEjecucion'
import ListaPlantillas from './pages/Admin/ListaPlantillas'
import './App.css'

function App() {
  const [vista, setVista] = useState<'admin' | 'tecnico' | 'constructor' | 'lista'>('lista')
  const [plantillaId, setPlantillaId] = useState<string | null>(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sistema de Listas de Chequeo Dinámicas</h1>
        <nav className="app-nav">
          <button 
            onClick={() => setVista('lista')}
            className={vista === 'lista' ? 'active' : ''}
          >
            Plantillas
          </button>
          <button 
            onClick={() => setVista('constructor')}
            className={vista === 'constructor' ? 'active' : ''}
          >
            Nuevo Constructor
          </button>
          <button 
            onClick={() => setVista('tecnico')}
            className={vista === 'tecnico' ? 'active' : ''}
          >
            Ejecutar Checklist
          </button>
        </nav>
      </header>

      <main className="app-main">
        {vista === 'lista' && (
          <ListaPlantillas 
            onEditar={(id) => {
              setPlantillaId(id)
              setVista('constructor')
            }}
          />
        )}
        {vista === 'constructor' && (
          <ConstructorPlantilla 
            plantillaId={plantillaId}
            onVolver={() => {
              setVista('lista')
              setPlantillaId(null)
            }}
          />
        )}
        {vista === 'tecnico' && (
          <RunnerEjecucion />
        )}
      </main>
    </div>
  )
}

export default App

