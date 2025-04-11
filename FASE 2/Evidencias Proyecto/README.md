1. Requisitos Generales
Git:
Necesario para clonar el repositorio.
Descargar Git

Editor de código (opcional, pero recomendado):
Por ejemplo, Visual Studio Code

2. Para el Frontend (por ejemplo, Ionic/Vite)
Node.js y npm:
Asegurarse de tener al menos Node.js versión 16.x y npm versión 8.x o superior.
Descargar Node.js

Ionic CLI:
Instalar Ionic globalmente para correr la aplicación.

npm install -g @ionic/cli
Dependencias del proyecto:
Una vez clonado el repositorio, desde la carpeta del frontend deben ejecutar:

npm install
Esto instalará todas las dependencias definidas en el package.json (incluyendo herramientas como Vite o frameworks específicos).

Comando para iniciar el servidor de desarrollo:
npm run ionic:serve
O bien el comando que figure en el package.json para levantar el servidor (por ejemplo, si se utiliza Vite u otro).

 Para el Backend (por ejemplo, PHP en XAMPP)
XAMPP (o similar):
Tener instalado XAMPP para ejecutar el backend.
Descargar XAMPP

PHP:
Asegurarse de que la versión de PHP instalada con XAMPP sea la requerida para el proyecto.

Configuración del servidor local:

Copiar la carpeta del backend a la carpeta htdocs de XAMPP (o bien, configurar el Virtual Host si lo prefieren).

Verificar y configurar archivos de conexión, variables de entorno (por ejemplo, si hay un archivo .env o configuración similar).

Dependencias adicionales en PHP (opcional):
Si el proyecto utiliza Composer, deberán:

composer install
(Esto se ejecuta en la carpeta del backend para instalar las dependencias de PHP, si corresponde.)

4. Pasos Generales para Iniciar el Proyecto
Clonar el Repositorio:

Desde Git o utilizando GitHub Desktop, clonar el repositorio:

git clone https://github.com/tu_usuario/CAPSTONE_2025_1_SIF_GRUPO2.git
Asegurarse de que la carpeta del proyecto esté organizada según lo acordado (por ejemplo, que el frontend y el backend se encuentren dentro de la carpeta FASE 2/Evidencias Proyecto o en la estructura definida).

Configurar el Frontend:

Navegar a la carpeta del frontend, por ejemplo:


cd "CAPSTONE_2025_1_SIF_GRUPO2/FASE 2/Evidencias Proyecto/gestor_flota/frontend"
Instalar dependencias:

npm install
Ejecutar el servidor de desarrollo:


npm run ionic:serve
Configurar el Backend:

Copiar (o mover) la carpeta del backend a la carpeta htdocs de XAMPP, por ejemplo:

C:\xampp\htdocs\gestor_flota_backend\
Configurar los archivos de conexión (bases de datos, etc.) y revisar el archivo de configuración si existe.

Encender Apache y MySQL a través del panel de XAMPP.

Acceder al proyecto backend desde el navegador, por ejemplo:

http://localhost/gestor_flota_backend/
Verificar Variables de Entorno y Configuración:
Si el proyecto utiliza archivos de configuración locales (por ejemplo, .env) que no se suben a GitHub, 
asegurarse de crear estos archivos siguiendo la documentación o un ejemplo que se incluya en el repositorio (por ejemplo, un archivo .env.example).
