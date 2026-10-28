import { Variable, RedBayesiana } from "./redBayesiana.js";
import { Factor, crearFactor } from "./factores.js";
import { consultar } from "./consulta.js";

const red = new RedBayesiana();
const lluvia = new Variable("Lluvia", ["sí", "no"]);
const aspersor = new Variable("Aspersor", ["sí", "no"]);
const cesped = new Variable("Césped mojado", ["sí", "no"]);
//const viento = new Variable("Viento", ["sí", "no"]);
//red.agregarVariable(viento);
//console.log(red.variables);

const factorLluvia = new Factor(
    ["Lluvia"],
    [
        { "Lluvia": "sí", probabilidad: 0.2 },
        { "Lluvia": "no", probabilidad: 0.8 }
    ]
);

console.log(factorLluvia);

const factorCesped = new Factor(
    ["Lluvia", "Césped mojado"],
    [
        { "Lluvia": "sí", "Césped mojado": "sí", probabilidad: 0.9 },
        { "Lluvia": "sí", "Césped mojado": "no", probabilidad: 0.1 },
        { "Lluvia": "no", "Césped mojado": "sí", probabilidad: 0.1 },
        { "Lluvia": "no", "Césped mojado": "no", probabilidad: 0.9 }
    ]
);
    
    
console.log(factorCesped);

const factorConjunto = factorLluvia.multiplicar(factorCesped);

const factorReducido = factorConjunto.sumarVariable("Lluvia");

const factorObservado = factorConjunto.observar(
    "Césped mojado",
    "sí"
);

console.log("Factor después de observar Césped mojado = sí:");
console.log(factorObservado);

const factorNormalizado = factorObservado.normalizar();

console.log("Probabilidades normalizadas:");
console.log(factorNormalizado);

console.log("Factor después de eliminar Lluvia:");
console.log(factorReducido);

console.log("Factor conjunto:");
console.log(factorConjunto);

red.agregarVariable(lluvia);
red.agregarVariable(aspersor);
red.agregarVariable(cesped);

console.log("Variables de la red:");

for (const variable of red.variables) {
    console.log(variable.nombre);
}

cesped.agregarPadre(lluvia);
cesped.agregarPadre(aspersor);

lluvia.agregarProbabilidades({
    sí: 0.2,
    no: 0.8
});

aspersor.agregarProbabilidades({
    sí: 0.4,
    no: 0.6
});

const factorAutomatico = crearFactor(lluvia);

console.log("Factor creado automáticamente:");
console.log(factorAutomatico);


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

const factorLluviaAutomatico = crearFactor(lluvia);
const factorAspersorAutomatico = crearFactor(aspersor);
const factorCespedAutomatico = crearFactor(cesped);

console.log("Factor de Lluvia:");
console.dir(factorLluviaAutomatico, { depth: null });

console.log("Factor de Aspersor:");
console.dir(factorAspersorAutomatico, { depth: null });

console.log("Factor de Césped mojado:");
console.dir(factorCespedAutomatico, { depth: null });

//consultar(red, "Aspersor", {
//  "Césped mojado": "sí"
//});

consultar(red, "Césped mojado", {
    "Lluvia": "sí"
});

//consultar(red, "Lluvia", {});
/*console.log(cesped.probabilidades);
console.log(lluvia.probabilidades);
console.log(red.obtenerVariable("Lluvia"));
console.log(red.variables.map(variable => variable.nombre));
*/

