# Resolución de fuentes — GitHub primero, respaldo acotado

## Origen oficial

- Repo `EQ-LABS-TECH/ee-monorepo`, rama SSOT `main`.
- Primero verificar **acceso efectivo** al conector GitHub de la sesión (no asumir credenciales ni pedir tokens). Obtener commit HEAD SHA y consultar cada archivo por ese SHA; indexar búsqueda por `main` solo para descubrir rutas y después leer por SHA.
- Si no está disponible el conector, intentar lectura pública remota si está efectivamente accesible; anotar que no es conexión autenticada.
- En auditoría de PR, registrar base SHA y head SHA y sus diferencias; no confundir HEAD del PR con main.
- Registrar mecanismo, repositorio, SHA, rutas y límites de lectura. Si el proveedor no permite obtener SHA, no simular reproducibilidad: declarar ref mutable y limitar conclusiones.

## Respaldo offline (regla explícita del usuario)

| Fuente                                                 | Cuándo                                                           | Cobertura verificable                                                            | Exclusiones                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| GitHub remoto al SHA                                   | Prioritario, si realmente accesible                              | Solo archivos recuperados y comparados; árbol según consulta                     | Archivos no inspeccionados                                                                                                  |
| `Paquetes_Archivos_Monorepo.md`                        | **Solo si GitHub es inaccesible**                                | Inventario del monorepo **excepto `docs/`**, sujeto a versión/captura declaradas | **Toda carpeta `docs/`**, contenidos completos de código, resultados de CI, contenido normativo salvo que se adjunte aparte |
| Archivos `.md` y demás artefactos del usuario/proyecto | Para documentación `docs/` sin GitHub o evidencia complementaria | Exclusivamente archivos aportados e inspeccionados                               | `docs/` no aportados, frescura respecto a `main` y artefactos no incluidos                                                  |

- La falta de una ruta en el inventario **no prueba ausencia en `main`**; puede ser por cobertura, edad o formato. No clasificarla como Crítico sin corroboración.
- Sin acceso a GitHub, la auditoría puede continuar como `SNAPSHOT SIN VERIFICAR CONTRA MAIN`, pero **no certificar estado vigente de `main`**. Una auditoría documental formal solo puede obtener veredicto si reúne todos los inputs normativos completos exigidos por los criterios aplicables y explicita su procedencia, nunca afirmar equivalencia a `main`.
- Si `docs/` no está disponible por otras fuentes, su estado es `NO VERIFICABLE`; **no interpolar documentos desde el inventario**.
- Si remoto y snapshot discrepan, reportar diferencias, privilegiando remoto para estado actual sin descartar cambios locales inéditos.

## Seguridad

Solo lectura por defecto. No almacenar tokens ni secretos en el skill, reportes o logs. Cambios remotos solo previa autorización y por rama/PR.
