# Guía de Despliegue: Sistema POS en Azure

Sigue estos pasos para subir tu proyecto final a la nube y obtener tu URL pública para la presentación.

## 1. Preparar el Repositorio en GitHub
1. Ve a [GitHub](https://github.com/) e inicia sesión con tu cuenta.
2. Crea un nuevo repositorio público (o privado) llamado `pos-azure-project`.
3. Abre tu terminal (Git Bash o Command Prompt) en la carpeta de tu proyecto local (`c:\Users\57301\Desktop\Ecomerce\pos_system`) y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Primer commit: Sistema POS listo para Azure"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/pos-azure-project.git
   git push -u origin main
   ```
*(Asegúrate de reemplazar `TU_USUARIO` por tu usuario real de GitHub).*

## 2. Configurar la Base de Datos (Azure SQL)
Dado que ya tienes el servidor `analytics-server-ronaldo-valbuena.database.windows.net` y la base de datos `analyticsdb`:
1. Abre tu **Azure Data Studio** o **SQL Server Management Studio (SSMS)**.
2. Conéctate a tu servidor de Azure usando tu usuario `ronaldo` y tu contraseña.
3. Abre una nueva consulta (Query) conectada a `analyticsdb`.
4. Copia el contenido del archivo `database_schema.sql` (que está en este proyecto) y ejecútalo. Esto creará todas las tablas y los datos de prueba necesarios para la demostración.

## 3. Crear el Azure App Service
1. Inicia sesión en el [Portal de Azure](https://portal.azure.com/).
2. Busca y selecciona **App Services** y haz clic en **+ Crear** -> **Aplicación web**.
3. **Detalles del proyecto:** Selecciona tu suscripción y grupo de recursos de estudiante.
4. **Detalles de la instancia:**
   - **Nombre:** Elige un nombre único (ej. `pos-ronaldo-valbuena`). Tu URL será `https://pos-ronaldo-valbuena.azurewebsites.net`.
   - **Publicar:** Selecciona **Código**.
   - **Pila del entorno de ejecución (Runtime stack):** Selecciona **Python 3.11**.
   - **Sistema operativo:** Linux (recomendado para Python en Azure).
   - **Región:** Selecciona la más cercana a ti.
5. Selecciona el plan de precios (el plan gratuito **F1** es perfecto para proyectos universitarios).
6. Haz clic en **Revisar y crear** y luego en **Crear**.

## 4. Desplegar desde GitHub
1. Una vez creado el App Service, ve al recurso.
2. En el menú izquierdo, bajo **Implementación**, selecciona **Centro de implementación (Deployment Center)**.
3. En **Origen**, selecciona **GitHub**. Autoriza tu cuenta si te lo pide.
4. Selecciona tu organización, el repositorio `pos-azure-project` y la rama `main`.
5. Haz clic en **Guardar**. Azure Actions configurará automáticamente el despliegue.

## 5. Configurar Variables de Entorno
Tu aplicación necesita la contraseña de la base de datos para funcionar:
1. En el menú izquierdo del App Service, bajo **Configuración**, selecciona **Variables de entorno**.
2. En la pestaña **Configuración de la aplicación (App settings)**, haz clic en **+ Agregar**.
3. Agrega la siguiente variable:
   - **Nombre:** `DB_PASSWORD`
   - **Valor:** *(Tu contraseña real de la base de datos Azure SQL)*
4. Haz clic en **Aplicar** y luego en **Guardar**.

## 6. Configurar el Comando de Inicio
1. En el mismo menú **Configuración**, selecciona la pestaña **Configuración general**.
2. En el campo **Comando de inicio**, escribe exactamente:
   ```bash
   gunicorn --bind=0.0.0.0 --timeout 600 app:app
   ```
3. Guarda los cambios. El servicio se reiniciará.

## 7. ¡Listo para Presentar!
- Haz clic en la URL que aparece en la página general de tu App Service.
- La primera vez puede tardar un par de minutos en cargar mientras Gunicorn instala las librerías (`pyodbc`, `flask`, etc.).
- ¡Prueba hacer ventas, agregar productos y muestra tu URL pública en la sustentación!
