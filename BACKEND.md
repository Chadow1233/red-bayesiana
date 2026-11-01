# Documentación del Backend — Red Bayesiana

## 1. Introducción

El backend del proyecto Red Bayesiana se encarga de administrar la estructura de las redes bayesianas, almacenar sus variables y relaciones, procesar sus tablas de probabilidades condicionales y realizar consultas probabilísticas mediante el algoritmo de eliminación de variables.

Su propósito es proporcionar la lógica necesaria para que la aplicación pueda construir redes bayesianas, consultar probabilidades y obtener resultados a partir de la evidencia proporcionada por el usuario.

El backend se comunica con el frontend mediante una API REST.

## 2. Tecnologías utilizadas

- **JavaScript:** lenguaje utilizado para desarrollar la lógica del backend.
- **Node.js:** entorno de ejecución de JavaScript.
- **API REST:** mecanismo de comunicación entre el frontend y el backend.
- **JSON:** formato utilizado para representar y almacenar la información de las redes bayesianas.
- **Git y GitHub:** herramientas utilizadas para el control de versiones y almacenamiento del proyecto.

## 3. Estructura del backend

El backend está organizado en los siguientes archivos:

| Archivo | Responsabilidad |
|---|---|
| redBayesiana.js | Administración de variables y relaciones de la red. |
| factores.js | Operaciones matemáticas con factores probabilísticos. |
| consulta.js | Ejecución del algoritmo de eliminación de variables. |
| almacenamiento.js | Guardado y recuperación de redes bayesianas. |
| servidor.js | Configuración del servidor y endpoints de la API. |

### 3.1 redBayesiana.js

Este archivo contiene las clases principales para representar una red bayesiana.

**Clase Variable**

Permite crear variables con un nombre y una lista de estados posibles.

Cada variable puede tener:
- Un nombre único.
- Dos o más estados.
- Una lista de variables padre.
- Una tabla de probabilidades condicionales (CPT).

También permite establecer relaciones entre variables y asignar sus probabilidades.

**Clase RedBayesiana**

Administra el conjunto de variables que forman la red.

Sus responsabilidades incluyen:
- Agregar variables.
- Buscar variables por nombre.
- Evitar nombres duplicados.
- Limitar la red a un máximo de 10 variables.

**Relaciones entre variables**

Las relaciones representan dependencias probabilísticas entre los nodos.

Se implementaron validaciones para impedir:
- Que una variable sea su propio padre.
- Que se agreguen relaciones duplicadas.
- Que se establezcan relaciones con variables inexistentes.
- Que se formen ciclos en la red.

Cuando se modifica la lista de padres de una variable, se invalida su CPT anterior para evitar conservar probabilidades que ya no corresponden a su estructura.

## 4. Tablas de probabilidades condicionales (CPT)

Cada variable debe contar con una distribución de probabilidades que represente sus estados.

Cuando una variable tiene padres, sus probabilidades dependen de las combinaciones posibles de estados de dichos padres.

Se implementó la validación de las tablas CPT para comprobar que:

- Se incluyan todos los estados necesarios.
- No existan estados desconocidos.
- Las probabilidades sean valores numéricos finitos.
- Cada probabilidad se encuentre entre 0 y 1.
- La suma de probabilidades de cada combinación de padres sea igual a 1, considerando una tolerancia numérica de 0.000001.

Estas comprobaciones permiten mantener la consistencia de las distribuciones probabilísticas.

## 5. factores.js — Operaciones con factores

Este archivo implementa la clase Factor y las operaciones necesarias para realizar inferencias probabilísticas.

Un factor representa una distribución sobre una o varias variables mediante una tabla de combinaciones de estados y sus probabilidades.

Se implementaron las siguientes operaciones:

### 5.1 Creación de factores

Se generan factores a partir de las variables y sus tablas CPT.

Cada factor contiene las variables involucradas y las probabilidades correspondientes a sus combinaciones de estados.

### 5.2 Multiplicación de factores

Permite combinar dos factores.

El procedimiento consiste en:
1. Revisar las combinaciones de estados de ambos factores.
2. Identificar las filas compatibles.
3. Combinar sus variables.
4. Multiplicar las probabilidades correspondientes.

El resultado es un nuevo factor que representa la combinación de las distribuciones.

### 5.3 Observación de evidencia

Permite filtrar un factor de acuerdo con el estado observado de una variable.

Por ejemplo, si se conoce que la variable Lluvia tiene el estado "sí", se conservan únicamente las filas compatibles con esa observación.

### 5.4 Sumar una variable

Esta operación realiza la marginalización de una variable.

Consiste en agrupar las filas que tienen los mismos estados en las demás variables y sumar sus probabilidades.

De esta manera se elimina una variable del factor sin perder la información probabilística correspondiente a las variables restantes.

### 5.5 Normalización

Divide las probabilidades del factor entre su suma total para obtener una distribución normalizada.

También comprueba que la suma no sea cero ni un valor inválido, evitando realizar divisiones que no produzcan una distribución válida.

## 6. consulta.js — Eliminación de variables

Este archivo contiene la lógica principal para realizar consultas probabilísticas mediante el algoritmo de eliminación de variables.

El algoritmo permite obtener la distribución de una variable de consulta considerando la evidencia proporcionada.

### Funcionamiento del algoritmo

1. Se recibe la variable que se desea consultar y la evidencia disponible.
2. Se validan las variables y los estados involucrados.
3. Se generan los factores correspondientes a las variables de la red.
4. Se aplica la evidencia mediante el filtrado de factores.
5. Se identifican las variables que deben eliminarse.
6. Se multiplican los factores que contienen cada variable que se va a eliminar.
7. Se marginaliza la variable mediante la suma de sus estados.
8. Se combinan los factores restantes.
9. Se normaliza el resultado.
10. Se devuelve la distribución de probabilidades de la variable consultada.

El archivo también incluye una función de validación para comprobar que las variables necesarias para realizar la consulta tengan sus probabilidades asignadas.

### Ejemplo de consulta

Considerando una red con las variables A, B y C:

A → B → C

Se puede realizar la consulta:

P(A | C = sí)

Esto significa que se desea conocer la probabilidad de que A tenga cada uno de sus estados, sabiendo que C tiene el estado "sí".

El algoritmo utiliza los factores de la red, incorpora la evidencia y elimina las variables intermedias que no forman parte de la consulta ni de la evidencia.

## 7. servidor.js — API REST

Este archivo configura el servidor y permite que el frontend se comunique con la lógica del backend.

Se implementaron los siguientes endpoints:

| Método | Ruta | Función |
|---|---|---|
| GET | /api/variables | Obtener las variables de la red. |
| GET | /api/red | Obtener la estructura completa de la red. |
| POST | /api/variables | Crear una nueva variable. |
| POST | /api/probabilidades | Asignar las probabilidades de una variable. |
| POST | /api/relaciones | Establecer una relación entre dos variables. |
| POST | /api/consultar | Realizar una consulta probabilística. |

Los endpoints reciben y devuelven información mediante objetos JSON.

También se implementaron validaciones para evitar consultas con variables inexistentes, estados inválidos, evidencia incorrecta o variables que todavía no tienen asignadas sus probabilidades.

## 8. almacenamiento.js — Persistencia de datos

Este archivo permite guardar y recuperar la estructura de una red bayesiana.

Las funciones principales son:

**guardarRed**

- Convierte la red bayesiana a una estructura JSON.
- Guarda la información en un archivo.
- Utiliza un archivo temporal antes de reemplazar el archivo principal para reducir el riesgo de dejar información incompleta si ocurre un problema durante la escritura.

**cargarRed**

- Lee la información almacenada.
- Reconstruye las variables.
- Recupera sus estados y relaciones.
- Restaura las tablas de probabilidades.
- Comprueba que las relaciones sean válidas.

La persistencia permite recuperar la red después de cerrar y reiniciar el servidor.

## 9. Validaciones implementadas

Durante el desarrollo se agregaron validaciones para mantener la integridad de la red.

Entre las principales se encuentran:

- Nombres de variables vacíos o repetidos.
- Variables con menos de dos estados.
- Estados vacíos o duplicados.
- Más de diez variables en una red.
- Relaciones con variables inexistentes.
- Relaciones duplicadas.
- Relaciones que producen ciclos.
- Probabilidades fuera del intervalo permitido.
- Tablas CPT incompletas o con estados desconocidos.
- Sumas incorrectas de probabilidades.
- Consultas con variables inexistentes.
- Evidencia con estados inválidos.
- Consultas sobre variables que también aparecen como evidencia.
- Variables sin probabilidades asignadas.
- Resultados que no pueden normalizarse.

## 10. Pruebas realizadas

Se realizaron pruebas utilizando diferentes redes bayesianas para comprobar el funcionamiento de las operaciones y del algoritmo de inferencia.

### 10.1 Redes de prueba

Se utilizaron redes en forma de cadena:

A → B → C → ...

Se establecieron las siguientes probabilidades:

- P(A = sí) = 0.5
- P(A = no) = 0.5
- P(hijo = sí | padre = sí) = 0.8
- P(hijo = no | padre = sí) = 0.2
- P(hijo = sí | padre = no) = 0.2
- P(hijo = no | padre = no) = 0.8

Se realizaron consultas para conocer la probabilidad de A cuando la última variable de la cadena tenía el estado "sí".

### 10.2 Resultados obtenidos

| Red | Consulta | Resultado para A = sí | Resultado para A = no |
|---|---|---:|---:|
| 3 variables | P(A \| C = sí) | 0.680000000 | 0.320000000 |
| 4 variables | P(A \| D = sí) | 0.608000000 | 0.392000000 |
| 5 variables | P(A \| E = sí) | 0.564800000 | 0.435200000 |
| 10 variables | P(A \| J = sí) | 0.505038848 | 0.494961152 |

También se comprobó que, al consultar A sin proporcionar evidencia, se obtiene:

- P(A = sí) = 0.5
- P(A = no) = 0.5

Los resultados obtenidos fueron consistentes con los cálculos probabilísticos esperados para las redes utilizadas.

### 10.3 Pruebas de validación

Se realizaron pruebas adicionales enviando datos incorrectos a los endpoints de la API.

Se comprobó el rechazo de:

- Estados que no pertenecen a una variable.
- Probabilidades mayores que 1 o menores que 0.
- Distribuciones cuya suma no es igual a 1.
- Tablas CPT incompletas.
- Variables inexistentes.
- Relaciones que producen ciclos.
- Relaciones duplicadas.
- Variables repetidas.
- Variables sin estados suficientes.
- Intentos de crear una undécima variable.

También se comprobó que la red conservara sus datos después de reiniciar el servidor.

### 10.4 Persistencia

Se modificó una red, se guardó su información y posteriormente se reinició el servidor.

Después del reinicio se comprobó que:
- Las diez variables seguían presentes.
- Sus relaciones se habían conservado.
- Sus tablas CPT seguían disponibles.
- Las consultas continuaban produciendo los resultados esperados.

## 11. Ejecución del backend

Para iniciar el servidor desde la carpeta principal del proyecto se utiliza:

```bash
node backend/servidor.js
```

El servidor utiliza el puerto 3000.

El frontend puede comunicarse con el backend mediante las rutas de la API, utilizando la configuración de proxy correspondiente.

## 12. Conclusiones

El desarrollo del backend permitió implementar la lógica necesaria para construir y administrar redes bayesianas, establecer relaciones entre variables, validar distribuciones de probabilidad y realizar inferencias mediante eliminación de variables.

Se implementaron operaciones matemáticas con factores, persistencia de información y una API REST para facilitar la comunicación con el frontend.

Las pruebas realizadas con redes de diferentes tamaños permitieron comprobar el funcionamiento del algoritmo y las validaciones implementadas.

El resultado es un backend funcional que proporciona las operaciones principales necesarias para el sistema de redes bayesianas.

## 13. Contribución al proyecto

Mi participación en el proyecto consistió en el desarrollo de la lógica del backend.

Las actividades realizadas incluyeron:

- Diseño e implementación de la estructura de las redes bayesianas.
- Desarrollo de las clases para representar variables y redes.
- Implementación de las relaciones entre variables y validación de ciclos.
- Implementación de la creación y validación de tablas CPT.
- Desarrollo de las operaciones de factores probabilísticos.
- Implementación del algoritmo de eliminación de variables.
- Desarrollo de las consultas probabilísticas con evidencia.
- Implementación del almacenamiento y recuperación de redes.
- Desarrollo de los endpoints de la API REST.
- Realización de pruebas funcionales y validaciones.
- Comprobación de resultados con redes de diferentes tamaños.
