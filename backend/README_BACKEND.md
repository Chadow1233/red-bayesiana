# Backend de la red bayesiana

## Descripción

El backend permite construir y consultar redes bayesianas mediante el método de eliminación de variables.

Está desarrollado con Node.js y Express.

## Requisitos

- Node.js instalado.
- Dependencias del proyecto instaladas mediante `npm install`.

## Cómo iniciar el proyecto

Abre dos terminales en la carpeta principal del proyecto.

### Terminal 1: Backend

Ejecuta:

node backend/servidor.js


El servidor estará disponible en:

`http://localhost:3000`

### Terminal 2: Frontend

Ejecuta:

bash
npm run dev


Vite mostrará la dirección local donde puedes abrir la interfaz, normalmente `http://localhost:5173`.

## Endpoints disponibles

### Obtener las variables

**GET** `/api/variables`

Devuelve las variables existentes, sus estados y sus padres.

### Crear una variable

**POST** `/api/variables`

Ejemplo:

json
{
  "nombre": "Viento",
  "estados": ["fuerte", "débil"]
}


### Crear una relación

**POST** `/api/relaciones`

Ejemplo:

json
{
  "padre": "Temperatura",
  "hijo": "Lluvia"
}


### Asignar probabilidades

**POST** `/api/probabilidades`

Ejemplo para una variable sin padres:

json
{
  "nombre": "Temperatura",
  "probabilidades": {
    "alta": 0.6,
    "baja": 0.4
  }
}


Las variables con padres necesitan tablas condicionales que correspondan a los estados de sus padres.

### Consultar probabilidades

**POST** `/api/consultar`

Ejemplo sin evidencia:

json
{
  "variable": "Lluvia",
  "evidencia": {}
}


Ejemplo con evidencia:

json
{
  "variable": "Lluvia",
  "evidencia": {
    "Temperatura": "alta"
  }
}


La respuesta contiene la probabilidad calculada para cada estado de la variable consultada.

## Integración con React

El frontend debe enviar solicitudes HTTP a los endpoints anteriores y mostrar sus respuestas.

Como Vite y Express utilizan puertos diferentes, se debe configurar un proxy de Vite o CORS en Express para permitir las solicitudes.

## Persistencia

El backend guarda la red en un archivo JSON y la recupera cuando se inicia el servidor.

## Consideraciones

- Las variables deben tener nombres y estados válidos.
- Las distribuciones de probabilidad deben sumar 1.
- No se permiten relaciones que creen ciclos.
- Las variables necesarias para una consulta deben tener probabilidades asignadas.
- `/api/variables` devuelve nombres, estados y padres, pero no las tablas de probabilidades.