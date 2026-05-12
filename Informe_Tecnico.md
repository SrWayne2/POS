# Informe Técnico del Proyecto: Sistema POS en la Nube

## 1. Identificación del Problema o Necesidad
La gestión eficiente del inventario y las ventas es un desafío fundamental para los pequeños y medianos almacenes. Muchos de estos negocios operan utilizando métodos manuales o software local sin respaldo automático, lo que resulta en:
- Pérdida o discrepancia de datos de inventario.
- Limitada accesibilidad (solo desde la tienda física).
- Falta de análisis de datos en tiempo real.

**Solución Propuesta:** Diseñar y desplegar un Sistema de Punto de Venta (POS) en la nube mediante Azure, proporcionando acceso global, copias de seguridad automáticas y procesamiento en tiempo real.

## 2. Arquitectura de Software
El sistema sigue una arquitectura cliente-servidor basada en la nube:
- **Frontend (Cliente):** Construido con HTML5, CSS3 (con un tema oscuro ejecutivo) y JavaScript (Fetch API para llamadas asíncronas). Garantiza una experiencia de usuario fluida y adaptable.
- **Backend (Servidor):** Desarrollado en Python utilizando el microframework Flask. Expone endpoints RESTful para interactuar con la base de datos.
- **Base de Datos:** Azure SQL Database (Relacional), seleccionada por su alta disponibilidad, seguridad integrada y compatibilidad transaccional (ACID).
- **Plataforma de Despliegue:** Azure App Service, configurado con un entorno Python 3.11 y Gunicorn como servidor WSGI.

## 3. Operaciones CRUD (Persistencia de Datos)
El sistema integra operaciones CRUD completas:
- **Crear (Create):** Registro de nuevos clientes, productos y generación de ventas con sus respectivos detalles y movimientos de inventario.
- **Leer (Read):** Visualización del dashboard con métricas en tiempo real, búsqueda de productos por código de barras y listado del historial de ventas.
- **Actualizar (Update):** Modificación de precios (detal y mayorista), ajuste de stock y edición de datos de clientes.
- **Eliminar (Delete):** Implementado lógicamente o físicamente según las políticas de retención, aunque el enfoque principal de este dominio es la trazabilidad (registros de movimientos).

## 4. Gestión de la Base de Datos (Azure SQL)
La base de datos `analyticsdb` está alojada en el servidor `analytics-server-ronaldo-valbuena.database.windows.net`. 
El modelo relacional está compuesto por 5 tablas principales:
1. `Client`: Almacena información de consumidores y mayoristas.
2. `Product`: Gestiona el catálogo, precios diferenciados y stock.
3. `Sale`: Registra el encabezado de las transacciones financieras.
4. `SaleItem`: Representa el detalle de cada producto en una venta (Relación muchos a muchos entre Sale y Product).
5. `InventoryMovement`: Permite la trazabilidad absoluta de entradas y salidas de stock.

## 5. Mantenimiento y Despliegue
- **Control de Versiones:** Código gestionado mediante Git y alojado en GitHub.
- **Variables de Entorno:** Separación de credenciales sensibles (como la contraseña de la base de datos) del código fuente.
- **Despliegue Continuo:** Configurado mediante Azure App Service, lo que permite actualizaciones sin interrupción del servicio y mantenimiento centralizado en un entorno real.
