# army → tower (tower-architect)

`rigHuman`(src/50-rig.js)은 아군도 쓰므로 기존 플래그(`weapon`, `wScale`, `shield`, `shieldTint`, `torch`, `bow`/`draw`/`pitch`, `helm`, `plate`, `hood`, `robe`, `drum`, `standard`, `keg`, `wraps`, `crown`, `heavy`, `claw`, `shamble`, `staff`, `cast`, `atk`, `tint`)의 동작은 그대로다. `KIT.foot` / `SPEC.foot` 호출부는 건드리지 않았다.

달라진 점:
- `SPEC.skel`, `SPEC.ogre`, `SPEC.golem`, `KIT.skel`, `KIT.giant`, `KIT.ogre`, `KIT.golem`은 없어졌다(→ `SPEC.man`, `KIT.man`). 아군 코드에서 참조하고 있지 않은지 확인.
- `KIT.item.*`의 키는 그대로지만 모양이 바뀌었다: `sword`(강철 외날 칼), `club`(철퇴), `hood`(검은 복면), `robe`(흰 긴 겉옷), `standard`(흰 군기), `keg`(질그릇 단지), `wraps`/`wrapHead`(가죽 멜빵/붉은 머리띠), `crown`(흰 깃 장식), `staff`(세모 영기). `helm`·`plate`·`torch`·`shieldR`(색만 밝은 나무)·`drum`은 원작과 거의 같다.
- 새로 쓸 수 있는 선택 플래그: `tintH`/`tintL`(머리, 아래팔·정강이를 따로 물들임 — 없으면 `tint`), `wTint`, `crouch`, `girth`, `mount`,
  `gear: [{ b: PartBatch, at: 0 몸통|1 머리|2 골반, t: tint, s: 배율 }]` — 시대별 모자·갑옷을 덧씌울 때 플래그를 더 만들 필요 없이 쓸 수 있다.
- 새 최상위 이름은 모두 `ar_` 접두어다.
