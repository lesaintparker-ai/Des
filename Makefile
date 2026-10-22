PY ?= python3

.PHONY: stills preview final audio qc

stills:   ## images clés en demi-résolution -> output/preview/stills/
	$(PY) -m src.render.render_video --stills=-0.5,2.5,7,12.8,16.5,21,25.8,35,37.6,40.6,46,50 --scale 0.5

audio:    ## mixage seul (+ stems) -> output/build/
	$(PY) -m src.audio.mix && $(PY) -m src.audio.qc

preview:  ## vidéo complète 960x540 -> output/preview/
	$(PY) -m src.render.assemble --preview

final:    ## vidéo complète 1920x1080 -> output/final/
	$(PY) -m src.render.assemble --final
