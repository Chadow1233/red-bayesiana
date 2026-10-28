import { Variable, RedBayesiana } from "./redBayesiana.js";

const red = new RedBayesiana();

// 1. Crear las variables
const lluvia = new Variable("Lluvia", ["sí", "no"]);
const aspersor = new Variable("Aspersor", ["sí", "no"]);
const cesped = new Variable("Césped mojado", ["sí", "no"]);

// 2. Agregar las variables a la red
red.agregarVariable(lluvia);
red.agregarVariable(aspersor);
red.agregarVariable(cesped);

// 3. Establecer los padres de Césped mojado
cesped.agregarPadre(lluvia);
cesped.agregarPadre(aspersor);

// 4. Definir las probabilidades iniciales
lluvia.agregarProbabilidades({
    sí: 0.2,
    no: 0.8
});

aspersor.agregarProbabilidades({
    sí: 0.4,
    no: 0.6
});

// 5. Definir las probabilidades de Césped mojado
cesped.agregarProbabilidades({
    "sí": {
        "sí": {
            "sí": 0.99,
            "no": 0.01
        },
        "no": {
            "sí": 0.90,
            "no": 0.10
        }
    },
    "no": {
        "sí": {
            "sí": 0.80,
            "no": 0.20
        },
        "no": {
            "sí": 0.01,
            "no": 0.99
        }
    }
});

// 6. Exportar la red para utilizarla en otros archivos
export { red };