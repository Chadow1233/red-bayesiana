class RedBayesiana {
    constructor() {
        this.variables = [];
    }

    agregarVariable(variable) {
        if (!(variable instanceof Variable)) {
            throw new Error("Debes agregar una variable válida");
        }

        if (this.obtenerVariable(variable.nombre)) {
            throw new Error("La variable ya existe");
        }

        this.variables.push(variable);
    }

    obtenerVariable(nombre) {
        return this.variables.find(
            variable => variable.nombre === nombre
        );
    }
}

class Variable {
    constructor(nombre, estados) {
        if (typeof nombre !== "string" || nombre.trim() === "") {
            throw new Error("La variable debe tener un nombre");
        }

        if (!Array.isArray(estados) || estados.length < 2) {
            throw new Error(
                "La variable debe tener al menos dos estados"
            );
        }

        if (
            estados.some(
                estado =>
                    typeof estado !== "string" ||
                    estado.trim() === ""
            )
        ) {
            throw new Error("Los estados deben ser textos válidos");
        }

        if (new Set(estados).size !== estados.length) {
            throw new Error(
                "La variable no puede tener estados repetidos"
            );
        }

        this.nombre = nombre.trim();
        this.estados = estados.map(estado => estado.trim());
        this.padres = [];
        this.probabilidades = {};
    }

    agregarPadre(padre) {
        if (!(padre instanceof Variable)) {
            throw new Error("El padre debe ser una variable válida");
        }

        if (padre === this) {
            throw new Error(
                "Una variable no puede ser su propio padre"
            );
        }

        if (this.padres.includes(padre)) {
            throw new Error("La variable ya tiene ese padre");
        }

        // Comprobar si agregar este padre produciría un ciclo.
        const pendientes = [padre];
        const visitadas = new Set();

        while (pendientes.length > 0) {
            const actual = pendientes.pop();

            if (actual === this) {
                throw new Error(
                    "La relación crearía un ciclo en la red"
                );
            }

            if (!visitadas.has(actual)) {
                visitadas.add(actual);

                for (const antecesor of actual.padres) {
                    pendientes.push(antecesor);
                }
            }
        }

        this.padres.push(padre);

        // La tabla anterior ya no corresponde a los padres nuevos.
        this.probabilidades = {};
    }

    agregarProbabilidades(probabilidades) {
        // Validar la tabla de probabilidades condicionales.
        function validarTabla(tabla, nivel, variable) {
            if (
                tabla === null ||
                typeof tabla !== "object" ||
                Array.isArray(tabla)
            ) {
                throw new Error(
                    "La tabla de probabilidades de " +
                    variable.nombre +
                    " tiene un formato inválido"
                );
            }

            let estadosEsperados;

            if (nivel < variable.padres.length) {
                estadosEsperados = variable.padres[nivel].estados;
            } else {
                estadosEsperados = variable.estados;
            }

            const claves = Object.keys(tabla);

            if (
                claves.length !== estadosEsperados.length ||
                estadosEsperados.some(
                    estado => !Object.hasOwn(tabla, estado)
                )
            ) {
                throw new Error(
                    "Faltan estados o hay estados desconocidos en la tabla de " +
                    variable.nombre
                );
            }

            // Si todavía estamos recorriendo los padres,
            // validar cada combinación de sus estados.
            if (nivel < variable.padres.length) {
                for (const estado of estadosEsperados) {
                    validarTabla(
                        tabla[estado],
                        nivel + 1,
                        variable
                    );
                }

                return;
            }

            // Validar las probabilidades de cada estado de la variable.
            let suma = 0;

            for (const estado of variable.estados) {
                const probabilidad = tabla[estado];

                if (
                    typeof probabilidad !== "number" ||
                    !Number.isFinite(probabilidad) ||
                    probabilidad < 0 ||
                    probabilidad > 1
                ) {
                    throw new Error(
                        "Probabilidad inválida en " +
                        variable.nombre +
                        ", estado " +
                        estado
                    );
                }

                suma += probabilidad;
            }

            if (Math.abs(suma - 1) > 0.000001) {
                throw new Error(
                    "Las probabilidades de cada combinación de " +
                    variable.nombre +
                    " deben sumar 1"
                );
            }
        }

        validarTabla(probabilidades, 0, this);

        this.probabilidades = probabilidades;
    }
}

export { Variable, RedBayesiana };