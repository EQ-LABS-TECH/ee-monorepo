# Jerarquía y precedencia — EE-DOC-002 §03.1

## Tabla de niveles

```markdown
| Nivel | Tipo de Documento       | Autoridad                                            |
| :---: | :---------------------- | :--------------------------------------------------- |
|   1   | Índice Maestro          | Estructura documental y roadmap del ecosistema.      |
|   2   | Estándares Documentales | Cómo se escriben todos los documentos.               |
|   3   | Constitucionales        | Gobernanza del ecosistema.                           |
|   4   | Arquitectónicos         | Arquitectura del ecosistema.                         |
|  5+   | Especializados          | Aplican reglas de niveles superiores en su contexto. |
```

---

## Reglas de precedencia

- **Nivel superior gana.** Un documento de nivel inferior no puede contradecir
  uno de nivel superior, salvo excepción explícita del superior.
- **Empate de nivel.** Prevalece el documento aprobado más recientemente,
  salvo que exista relación explícita de dependencia entre ellos.

---

## SSOT por dominio (derivado — no está en §03.1, es práctica del ecosistema)

```markdown
| Dominio                | Documento SSOT | Sección   |
| :--------------------- | :------------- | :-------- |
| Estados y trazabilidad | EE-DOC-001     | §08 / §09 |
| Formato y plantilla    | EE-DOC-002     | §18       |
| Árbol físico           | EE-DOC-006     | §05       |
| Ciclo de vida          | EE-DOC-005     | §04       |
```

> **Nota:** Las tres primeras filas derivan de la práctica del ecosistema y de
> la jerarquía de §03.1. La cuarta (EE-DOC-005) deriva del ciclo de vida
> documental definido en la propia norma.

---

## Cambios a documentos congelados

**Congelado** protege la versión documental vigente; no vuelve inmutable el
documento. Todo cambio posterior debe seguir el mecanismo de cambio gobernado
(EE-DOC-001 R2), generar una nueva versión y conservar la versión congelada
como referencia histórica:

- **Aclaración** — sin cambio normativo sustantivo.
- **Especialización Técnica** — aplicación a un dominio concreto.
- **ADR** — decisión arquitectónica.
- **RFC** — cambio significativo o transversal.
