const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function pm() {
  return game.modules.get("prima-materia")?.api;
}

/**
 * Floating tint tracker widget.
 */
export class PrimaMateriaTintTracker extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  static DEFAULT_OPTIONS = {
    id: "prima-materia-tint-widget",
    tag: "section",
    classes: ["prima-materia-widget-app"],
    position: {
      width: 240,
      height: "auto",
      top: 88,
      left: 24,
    },
    window: {
      title: "Prima Materia Tint",
      icon: "fa-solid fa-circle-half-stroke",
      resizable: false,
    },
  };

  constructor(options = {}) {
    const width = 240;
    const left = Math.max(24, window.innerWidth - width - 24);
    options = foundry.utils.mergeObject(
      {
        position: { left },
      },
      options,
      { overwrite: false },
    );

    super(options);
  }

  static PARTS = {
    main: {
      template: "modules/prima-materia/templates/tint-widget.hbs",
    },
  };

  async _prepareContext() {
    const api = pm();
    const tint = api.getTint();

    return {
      tint,
      tintLabel: api.labelForTint(tint),
      tintDescription: api.describeTint(tint),
      neutralDescription: api.describeTint("neutral"),
      dayDescription: api.describeTint("day"),
      nightDescription: api.describeTint("night"),
    };
  }

  async _onClickAction(event, target) {
    event.preventDefault();

    if (target.dataset.action !== "set-tint") return;
    await pm().setTint(target.dataset.tint);
    await this.render({ force: true });
  }
}
