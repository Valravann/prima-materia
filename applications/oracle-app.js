const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function pm() {
  return game.modules.get("prima-materia")?.api;
}

/**
 * Main oracle launcher and mode host application.
 */
export class PrimaMateriaOracleApp extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  static DEFAULT_OPTIONS = {
    id: "prima-materia-oracle",
    tag: "section",
    classes: ["prima-materia-app"],
    position: {
      width: 720,
      height: "auto",
    },
    window: {
      title: "Prima Materia Oracle",
      icon: "fa-solid fa-sparkles",
    },
  };

  static PARTS = {
    main: {
      template: "modules/prima-materia/templates/oracle-window.hbs",
    },
  };

  constructor(options = {}) {
    super(options);
    this.pmState = {
      view: "peek",
      resultByView: {
        peek: null,
        pullPass: null,
        pinch: null,
        pluck: null,
      },
      pluckKey: "actions",
    };
  }

  async _prepareContext() {
    const api = pm();
    const currentFrame = api.getFrame();
    const currentTint = api.getTint();
    const view = this.pmState.view;
    const result = this.pmState.resultByView[view];

    return {
      currentFrame,
      currentFrameLabel: api.labelForFrame(currentFrame),
      currentFrameDescription: api.describeFrame(currentFrame),
      currentTint,
      currentTintLabel: api.labelForTint(currentTint),
      currentTintDescription: api.describeTint(currentTint),
      showInterpretations: api.showInterpretations(),
      currentPluckDescription:
        api.PACK_SOURCES[this.pmState.pluckKey]?.description ?? "",
      isPeek: view === "peek",
      isPullPass: view === "pullPass",
      isPinch: view === "pinch",
      isPluck: view === "pluck",
      peekActiveClass: view === "peek" ? "active" : "",
      pullPassActiveClass: view === "pullPass" ? "active" : "",
      pinchActiveClass: view === "pinch" ? "active" : "",
      pluckActiveClass: view === "pluck" ? "active" : "",
      pluckOptions: api.getPluckOptions().map((option) => ({
        ...option,
        selected: option.value === this.pmState.pluckKey ? "selected" : "",
      })),
      result,
      peekSaveDisabled: this.pmState.resultByView.peek ? "" : "disabled",
      pullPassSaveDisabled: this.pmState.resultByView.pullPass?.publishReady
        ? ""
        : "disabled",
      pinchSaveDisabled: this.pmState.resultByView.pinch?.publishReady
        ? ""
        : "disabled",
      pluckSaveDisabled: this.pmState.resultByView.pluck ? "" : "disabled",
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const select = this.element?.querySelector("select[name='pluck-key']");
    select?.addEventListener("change", (event) => {
      this.pmState.pluckKey = event.currentTarget.value;
      this.render({ force: true });
    });
  }

  async _onClickAction(event, target) {
    event.preventDefault();

    const api = pm();
    const action = target.dataset.action;

    try {
      switch (action) {
        case "set-view": {
          this.pmState.view = target.dataset.view ?? "peek";
          return this.render({ force: true });
        }

        case "open-portent": {
          return api.openPortent();
        }

        case "open-tint-widget": {
          return api.openTintWidget();
        }

        case "open-frame-widget": {
          return api.openFrameWidget();
        }

        case "peek-sol": {
          this.pmState.resultByView.peek = await api.rollPeek("sol");
          await api.postToChat(this.pmState.resultByView.peek);
          await api.maybeAutoSave(this.pmState.resultByView.peek);
          return this.render({ force: true });
        }

        case "peek-nox": {
          this.pmState.resultByView.peek = await api.rollPeek("nox");
          await api.postToChat(this.pmState.resultByView.peek);
          await api.maybeAutoSave(this.pmState.resultByView.peek);
          return this.render({ force: true });
        }

        case "roll-pull-pass": {
          this.pmState.resultByView.pullPass = await api.rollPullPass();
          return this.render({ force: true });
        }

        case "choose-pull-pass": {
          const choice = target.dataset.choice;
          const existing = this.pmState.resultByView.pullPass;
          if (!existing) return;
          this.pmState.resultByView.pullPass = api.resolvePullPass(
            existing,
            choice,
          );
          await api.postToChat(this.pmState.resultByView.pullPass);
          await api.maybeAutoSave(this.pmState.resultByView.pullPass);
          return this.render({ force: true });
        }

        case "roll-pinch": {
          this.pmState.resultByView.pinch = await api.rollPinch();
          return this.render({ force: true });
        }

        case "pinch-style": {
          const style = target.dataset.style;
          const existing = this.pmState.resultByView.pinch;
          if (!existing) return;
          this.pmState.resultByView.pinch = api.applyPinchStyle(
            existing,
            style,
          );
          await api.postToChat(this.pmState.resultByView.pinch);
          await api.maybeAutoSave(this.pmState.resultByView.pinch);
          return this.render({ force: true });
        }

        case "pinch-syzygy": {
          const existing = this.pmState.resultByView.pinch;
          if (!existing) return;
          this.pmState.resultByView.pinch = await api.addPinchSyzygy(existing);
          await api.postToChat(this.pmState.resultByView.pinch);
          await api.maybeAutoSave(this.pmState.resultByView.pinch);
          return this.render({ force: true });
        }

        case "draw-pluck": {
          this.pmState.resultByView.pluck = await api.drawPluck(
            this.pmState.pluckKey,
          );
          await api.postToChat(this.pmState.resultByView.pluck);
          await api.maybeAutoSave(this.pmState.resultByView.pluck);
          return this.render({ force: true });
        }

        case "save-journal": {
          const result = this.pmState.resultByView[this.pmState.view];
          if (result) await api.saveToJournal(result);
          return;
        }

        default:
          return;
      }
    } catch (error) {
      console.error("prima-materia | Oracle action failed", error);
      ui.notifications?.error(`Prima Materia action failed: ${error.message}`);
    }
  }
}
