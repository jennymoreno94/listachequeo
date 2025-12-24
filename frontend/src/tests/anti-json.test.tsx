import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConstructorPlantilla from '../pages/Admin/ConstructorPlantilla';
import PestañaDatosBasicos from '../pages/Admin/PestañaDatosBasicos';
import PestañaPreguntas from '../pages/Admin/PestañaPreguntas';
import PestañaTransiciones from '../pages/Admin/PestañaTransiciones';
import PestañaResultados from '../pages/Admin/PestañaResultados';
import PestañaValidar from '../pages/Admin/PestañaValidar';

describe('Test Anti-JSON: Verificar que no aparezcan controles/textos relacionados con JSON', () => {
  const textosProhibidos = [
    'JSON de Plantilla',
    'Pega aquí el JSON',
    'Editor JSON',
    'JSON de plantilla',
    'pega aquí el json',
    'editor json',
    'JSON',
    'json',
  ];

  it('No debe aparecer texto "JSON de Plantilla" en ConstructorPlantilla', () => {
    render(<ConstructorPlantilla onVolver={() => {}} />);
    textosProhibidos.forEach(texto => {
      expect(screen.queryByText(new RegExp(texto, 'i'))).toBeNull();
    });
  });

  it('No debe aparecer texto "JSON" relacionado con plantilla en PestañaDatosBasicos', () => {
    render(<PestañaDatosBasicos />);
    const contenido = document.body.textContent || '';
    textosProhibidos.forEach(texto => {
      // Solo verificar si el texto aparece en contexto de plantilla/editor
      if (contenido.toLowerCase().includes('json') && 
          (contenido.toLowerCase().includes('plantilla') || 
           contenido.toLowerCase().includes('editor'))) {
        expect(contenido).not.toContain(texto);
      }
    });
  });

  it('No debe aparecer controles de edición JSON en PestañaPreguntas', () => {
    render(<PestañaPreguntas />);
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const placeholder = input.getAttribute('placeholder') || '';
      const label = input.getAttribute('aria-label') || '';
      textosProhibidos.forEach(texto => {
        expect(placeholder.toLowerCase()).not.toContain(texto.toLowerCase());
        expect(label.toLowerCase()).not.toContain(texto.toLowerCase());
      });
    });
  });

  it('No debe aparecer texto "JSON" en labels o placeholders de PestañaTransiciones', () => {
    render(<PestañaTransiciones />);
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
      const texto = label.textContent || '';
      textosProhibidos.forEach(prohibido => {
        if (texto.toLowerCase().includes('json') && 
            (texto.toLowerCase().includes('plantilla') || 
             texto.toLowerCase().includes('editor'))) {
          expect(texto).not.toContain(prohibido);
        }
      });
    });
  });

  it('PestañaResultados puede tener JSON en payload de acciones (es válido)', () => {
    // Este test verifica que JSON en payload de acciones es aceptable
    // ya que es parte de la configuración interna, no un editor JSON visible
    render(<PestañaResultados />);
    // No debe haber un editor JSON general para la plantilla
    const contenido = document.body.textContent || '';
    expect(contenido).not.toContain('JSON de Plantilla');
    expect(contenido).not.toContain('Pega aquí el JSON');
    expect(contenido).not.toContain('Editor JSON');
  });

  it('PestañaValidar no debe mostrar editor JSON', () => {
    render(<PestañaValidar />);
    const contenido = document.body.textContent || '';
    textosProhibidos.forEach(texto => {
      if (contenido.toLowerCase().includes('json') && 
          contenido.toLowerCase().includes('plantilla')) {
        expect(contenido).not.toContain(texto);
      }
    });
  });

  it('Verificar que no existan textareas o inputs con placeholder relacionado a JSON de plantilla', () => {
    // Renderizar todas las pestañas y verificar
    const componentes = [
      <PestañaDatosBasicos key="1" />,
      <PestañaPreguntas key="2" />,
      <PestañaTransiciones key="3" />,
      <PestañaResultados key="4" />,
      <PestañaValidar key="5" />,
    ];

    componentes.forEach(componente => {
      const { container } = render(componente);
      const inputs = container.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const placeholder = (input as HTMLInputElement).placeholder || '';
        const prohibidosEnPlaceholder = [
          'JSON de Plantilla',
          'Pega aquí el JSON',
          'Editor JSON',
        ];
        prohibidosEnPlaceholder.forEach(prohibido => {
          expect(placeholder).not.toContain(prohibido);
        });
      });
    });
  });
});

