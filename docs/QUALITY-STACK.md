# Where HCB sits in the quality stack

There are several projects with "quality" in the name. They do different jobs. This page is the map.

| Layer | Project | Question it answers | Produces |
|---|---|---|---|
| Rules | [dsh-plugin-spec](https://github.com/PerryLink/dsh-plugin-spec) | what is a compliant plugin? | numbered clauses |
| Checker / audit | [dsh-standards](https://github.com/PerryLink/dsh-standards) | does this plugin pass ENTRY/FLOW/BOOST? | `dsh-levels/1` report |
| Static precheck | [dsh-plugin-ready](https://github.com/PerryLink/dsh-plugin-ready) | can it be recognized without booting? | static ENTRY |
| Dynamic check | [dsh-clinic](https://github.com/PerryLink/dsh-clinic) | does it load and behave? | 4-layer detection |
| **Data / gate** | **HCB (this repo)** | which hosts does it declare, which tracks does it claim, what risk, pilot or review? | matrix + `hcb-gate/1` |
| Quality score | [dsh-score](https://github.com/PerryLink/dsh-score) | how good is it across five dimensions? | score + risk card |
| Certification / registry | [dsh-certification](https://github.com/PerryLink/dsh-certification) | what is publicly registered and reproducible? | badge + registry |
| Vertical compliance | [dsh-check-pack](https://github.com/PerryLink/dsh-check-pack) | does it meet a specific industry rule set? | 53 checkers |

## Decision tree

```
Do you need to know "will it install and run on my DSH version?"
  -> HCB (compatibility + tracks + risk + gate)

Do you need to know "does it pass the ENTRY/FLOW/BOOST clauses?"
  -> dsh-standards (checker) / dsh-plugin-ready (static) / dsh-clinic (dynamic)

Do you need a quality score or a public certification?
  -> dsh-score / dsh-certification

Do you need an industry-specific document check?
  -> dsh-check-pack
```

## Boundaries (do not blur)

- **HCB does not score or certify.** It records declared data and recommends `review / pilot / production-candidate`.
- **HCB does not replace the checker.** It consumes `dsh.standards`; in v0.5 it will ingest checker output as `checked` evidence.
- **dsh-score / dsh-certification should read HCB** for compatibility/risk instead of maintaining their own host matrix.
- **ENTRY / FLOW / BOOST are not levels.** No total score; BOOST is not a gate.
