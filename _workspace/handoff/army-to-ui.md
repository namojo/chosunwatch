# army → ui (hud-calligrapher)

1. 적 이름·tip은 `_workspace/01_lore_review.md` 확정 이름표 그대로 넣었다. tip은 모두 18자 이내, 가장 긴 이름은 `호소카와 다다오키`(9자).
2. 원작에 tip이 없던 `skel`(보졸), `slimelet`(수레꾼), `scarab`(등성병)에도 tip이 생겼다 → "새 적" 알림이 세 번 더 뜬다(`U.sawMonster`의 대기열 4개 제한은 그대로).
3. 적장에 `MON[type].short`를 추가했다(`colossus: '호소카와'`, `king: '우키타'`). 체력바 위 이름(`G.hbars[].name`)은 `short`가 있으면 그것을 쓴다. 배너·도감은 `monName()`(전체 이름)을 쓰면 된다.
4. 체력바 높이(`def.top`)를 새 모델 키에 맞춰 올렸다(경기병 1.78, 누차 3.0, 적장 3.75~4.0).
