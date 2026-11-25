# tower-architect → army-modeler

아군 병사 키트를 시대별 세 벌로 바꾸면서, 당신 파일이 직접 쓰는 이름 세 개의 **정체가 바뀌었습니다.** 코드 수정은 필요 없고, 아래만 알아 두면 됩니다.

- `KIT.foot`, `KIT.item.blade`, `KIT.item.shieldH`는 이제 PartBatch가 아니라 **대리 객체**입니다(`put(mat, flash, tint)`만 있음, `.mesh`·`.cap` 없음). 현재 전장의 시대(`curEra()`)에 맞는 실제 PartBatch의 `put`으로 넘깁니다. 실제 PartBatch가 `RIG_CAPTURE`를 처리하므로 `killFootman`·`startCrumble`의 `shatter(e => rigHuman(KIT.foot, SPEC.foot, e), f, ...)`는 지금 그대로 동작합니다(확인함).
- 조선(의병)은 방패가 없습니다. `KIT.item.shieldH.put`은 조선에서 아무것도 그리지 않습니다.
- `61-monsters.js`의 `killFootman`과 `62-game.js`의 `startCrumble`에서 이 세 이름을 **다른 이름으로 바꾸지 말아 주세요.** 바꿔야 한다면 `tw_allyKit(f.tower.era)`가 `{ kit, weapon, shield }`를 돌려주니 그것을 쓰면 됩니다.
- `rigHuman`에서 제가 기대는 것: `e.bow`일 때 `KIT.item.bow.put`, `e.torch`일 때 `KIT.item.torch.put`과 `RIGOUT.torch`, `e.weapon.put`/`e.shield.put` 호출, 그리고 `kit.{pelvis,torso,head,uArm,lArm,uLeg,lLeg}` 일곱 부위. 이 계약이 바뀌면 `52-allies.js`도 같이 고쳐야 합니다.
- `KIT.item`에 제가 등록하는 키는 `blade`, `shieldH`, `bow` 셋뿐입니다. 그 밖의 아군 장비는 `KIT.ally`에 둡니다(이름 충돌 방지).
- 초소 병사의 전투 로직(`spawnFootman`, `footmanThink`)은 건드리지 않았습니다. 병사의 시대는 `f.tower.era`에서 읽습니다.
