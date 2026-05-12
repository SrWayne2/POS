# Plan de Implementación: Completar CRUD, Configuración y Renombre a NexusPOS

Para garantizar que el proyecto obtenga la máxima calificación (cumpliendo con el CRUD completo) y tenga una configuración profesional, se realizarán los siguientes ajustes.

## Proposed Changes

### Archivos de Configuración (Git y Entorno)
#### [NEW] .gitignore
Se creará este archivo para evitar que se suban al repositorio archivos temporales o sensibles:
- `venv/`
- `__pycache__/`
- `*.pyc`
- `.env`
- `pos_database.db`

#### [NEW] .env.example
Se creará un archivo de plantilla para las variables de entorno, de forma que el profesor sepa qué configurar sin exponer tus credenciales reales:
- `DB_PASSWORD=your_password_here`

### Backend (app.py)
#### [MODIFY] app.py
Se añadirán dos nuevos endpoints (rutas API) para soportar la operación DELETE:
- `DELETE /api/clients/<id>`: Permitirá eliminar un cliente (o marcarlo como inactivo si tiene ventas asociadas para no romper el historial).
- `DELETE /api/products/<id>`: Permitirá eliminar un producto.

### Frontend (Renombre y Botones)
#### [MODIFY] templates/index.html
- Se cambiará el nombre de "MW Sport Wear" a "NexusPOS" en el sidebar, ticket de impresión y en el título general.
- *(Nota: `requirements.txt` y `app.py` ya estaban corregidos en el paso anterior, pero me aseguraré de que todo siga en orden).*

#### [MODIFY] static/js/main.js
- Se añadirán las funciones JavaScript `deleteClient(id)` y `deleteProduct(id)` que llamarán a los nuevos endpoints del backend pidiendo confirmación al usuario antes de borrar.
- Se actualizarán las funciones `loadClients()` y `loadInventory()` para que en la columna "Acción" de las tablas aparezca también el botón "Eliminar" (en color rojo para denotar peligro) al lado del botón "Editar".

#### [MODIFY] Informe_Tecnico.md
- Se actualizará el documento para reflejar el nuevo nombre "NexusPOS".

## User Review Required

> [!IMPORTANT]
> Al eliminar un Cliente o Producto que **ya tiene ventas registradas**, la base de datos podría arrojar un error de integridad (ya que la venta necesita saber a qué cliente/producto pertenece). 
> 
> **Decisión técnica a tomar:** El backend intentará eliminar el registro, pero si tiene dependencias, capturará el error de base de datos. Para mantener la simplicidad y cumplir la rúbrica del CRUD, el botón de eliminar estará completamente funcional. ¿Estás de acuerdo con avanzar con esta implementación?
