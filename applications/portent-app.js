const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function pm() {
  return game.modules.get("prima-materia")?.api;
}

/**
 * Dedicated portent roller and interpreter.
 */
export class PrimaMateriaPortentApp extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  static DEFAULT_OPTIONS = {
    id: "prima-materia-portent",
    tag: "section",
    classes: ["prima-materia-app"],
    position: {
      width: 680,
      height: "auto",
    },
    window: {
      title: "Prima Materia Portent",
      icon: "fa-solid fa-moon-stars",
    },
  };

  static PARTS = {
    main: {
      template: "modules/prima-materia/templates/portent-window.hbs",
    },
  };

  constructor(options = {}) {
    super(options);
    this.pmState = {
      result: null,
    };
  }

  async _prepareContext() {
    const api = pm();
    const currentFrame = api.getFrame();
    const currentTint = api.getTint();

    return {
      currentFrameLabel: api.labelForFrame(currentFrame),
      currentFrameDescription: api.describeFrame(currentFrame),
      currentTintLabel: api.labelForTint(currentTint),
      currentTintDescription: api.describeTint(currentTint),
      showInterpretations: api.showInterpretations(),
      result: this.pmState.result,
      saveDisabled: this.pmState.result ? "" : "disabled",
    };
  }

  async _onClickAction(event, target) {
    event.preventDefault();

    const api = pm();
    const action = target.dataset.action;

    try {
      switch (action) {
        case "roll-portent": {
          this.pmState.result = await api.rollPortent();
          await api.postToChat(this.pmState.result);
          await api.maybeAutoSave(this.pmState.result);
          return this.render({ force: true });
        }

        case "save-journal": {
          if (this.pmState.result) await api.saveToJournal(this.pmState.result);
          return;
        }

        default:
          return;
      }
    } catch (error) {
      console.error("prima-materia | Portent action failed", error);
      ui.notifications?.error(`Prima Materia portent failed: ${error.message}`);
    }
  }
}
